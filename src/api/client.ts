import { API_BASE_URL } from "./config";
import { mockAccessEnabled, getDemoUser } from "@/mocks/access";
import { mockRequest } from "@/mocks/api";
import { useAuthState, type LoginResponse } from "@/integrations/auth/state";
import { showRequestError } from "@/store/feedbackStore";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  responseType?: "blob";
  allowNotFound?: boolean;
};
const publicAuthPaths = new Set([
  "/auth/login",
  "/auth/refresh",
  "/auth/register",
  "/schools/search",
  "/auth/password-recovery/request",
  "/auth/password-recovery/verify",
  "/auth/password-recovery/reset",
]);
function isPublicPath(path: string) {
  return (
    publicAuthPaths.has(path) ||
    path.startsWith("/schools/search?") ||
    (/^\/invitations\/[^/]+(?:\/(verify|resend|complete))?$/.test(path) &&
      !["/invitations/teachers", "/invitations/coordinators"].includes(path))
  );
}
async function send<T>(
  path: string,
  options: RequestInit,
  responseType?: "blob",
  allowNotFound = false,
): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    credentials: isPublicPath(path) ? "include" : "omit",
    cache: "no-store",
  });
  const current = useAuthState.getState().session;
  if (
    !isPublicPath(path) &&
    current &&
    new Headers(options.headers).get("Authorization") === `Bearer ${current.accessToken}`
  ) {
    const expiry = response.headers?.get("X-Session-Expires-At");
    const warning = response.headers?.get("X-Session-Warning");
    const expiresAt = expiry && Number.isFinite(Date.parse(expiry)) ? expiry : current.expiresAt;
    const sessionExpiring = warning === "expiring" || (!expiry && current.sessionExpiring === true);
    if (expiresAt !== current.expiresAt || sessionExpiring !== (current.sessionExpiring === true))
      useAuthState.getState().setSession({ ...current, expiresAt, sessionExpiring });
  }
  if (allowNotFound && response.status === 404) return undefined as T;
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      problem?.detail ||
        (response.status === 401
          ? "Sua sessão expirou. Entre novamente."
          : "Não foi possível concluir a solicitação."),
      Array.isArray(problem?.errors) ? problem.errors : [],
    );
  }
  if (response.status === 204) return undefined as T;
  if (responseType === "blob") return (await response.blob()) as T;
  return response.json() as Promise<T>;
}
let lastActivityAt = 0;
export function recordSessionActivity() {
  lastActivityAt = Date.now();
}
let refreshing: { token: string; promise: Promise<void> } | null = null;

export function refreshSession(): Promise<void> {
  const session = useAuthState.getState().session;
  if (session && refreshing?.token === session.accessToken)
    return refreshing.promise;
  if (
    !session ||
    session.twoFactorRequired ||
    !(Date.parse(session.expiresAt) > Date.now()) ||
    !session.refreshToken ||
    !(Date.parse(session.refreshExpiresAt ?? "") > Date.now())
  ) {
    if (session) useAuthState.getState().setSession(null);
    return Promise.reject(
      new ApiError(401, "Sua sessão expirou. Entre novamente."),
    );
  }
  const promise = send<LoginResponse>("/auth/refresh", {
    method: "POST",
    headers: new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })
    .then((renewed) => {
      const current = useAuthState.getState().session;
      if (current?.accessToken !== session.accessToken)
        throw new DOMException(
          "Sessão alterada durante a renovação.",
          "AbortError",
        );
      if (!renewed.accessToken || !(Date.parse(renewed.expiresAt) > Date.now()))
        throw new ApiError(401, "Sua sessão expirou. Entre novamente.");
      useAuthState
        .getState()
        .setSession({
          ...current,
          accessToken: renewed.accessToken,
          tokenType: renewed.tokenType,
          expiresAt: renewed.expiresAt,
          sessionExpiring: false,
          refreshToken: null,
          refreshExpiresAt: null,
        });
    })
    .catch((error) => {
      if (useAuthState.getState().session?.accessToken === session.accessToken)
        useAuthState.getState().setSession(null);
      showRequestError(error);
      throw error;
    })
    .finally(() => {
      if (refreshing?.promise === promise) refreshing = null;
    });
  refreshing = { token: session.accessToken, promise };
  return promise;
}
async function request<T>(
  path: string,
  { body, responseType, allowNotFound, ...options }: Options = {},
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart)
    headers.set("Content-Type", "application/json");
  const isPublicAuthPath = isPublicPath(path);
  let session = useAuthState.getState().session;
  if (mockAccessEnabled && getDemoUser(session?.accessToken)) {
    options.signal?.throwIfAborted();
    return mockRequest(path, method, body, session!.accessToken) as T;
  }
  if (
    !isPublicAuthPath &&
    session &&
    Date.parse(session.expiresAt) <= Date.now()
  ) {
    useAuthState.getState().setSession(null);
    throw new ApiError(401, "Sua sessão expirou. Entre novamente.");
  }
  if (
    !isPublicAuthPath &&
    path !== "/auth/logout" &&
    session &&
    !session.twoFactorRequired &&
    session.refreshToken &&
    Date.parse(session.refreshExpiresAt ?? "") > Date.now() &&
    Date.parse(session.expiresAt) - Date.now() <= 5 * 60_000 &&
    lastActivityAt >= Date.parse(session.expiresAt) - 5 * 60_000
  ) {
    options.signal?.throwIfAborted();
    await refreshSession();
    options.signal?.throwIfAborted();
    session = useAuthState.getState().session;
  }
  if (session && path !== "/auth/login")
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (isPublicAuthPath) headers.delete("Authorization");
  try {
    const result = await send<T>(
      path,
      {
        ...options,
        method,
        headers,
        body: multipart
          ? body
          : body === undefined
            ? undefined
            : JSON.stringify(body),
      },
      responseType,
      allowNotFound,
    );
    if (
      session !== useAuthState.getState().session &&
      session?.accessToken !== useAuthState.getState().session?.accessToken
    ) {
      throw new DOMException(
        "Sessão alterada durante a solicitação.",
        "AbortError",
      );
    }
    return result;
  } catch (error) {
    if (isPublicAuthPath) throw error;
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      session?.refreshToken &&
      !session.twoFactorRequired &&
      Date.parse(session.refreshExpiresAt ?? "") > Date.now() &&
      session.accessToken === useAuthState.getState().session?.accessToken
    ) {
      await refreshSession();
      return request<T>(path, { ...options, body, responseType, allowNotFound });
    }
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      session?.accessToken === useAuthState.getState().session?.accessToken
    )
      useAuthState.getState().setSession(null);
    throw error;
  }
}
export async function apiRequest<T>(
  path: string,
  options: Options = {},
): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch (error) {
    showRequestError(error);
    throw error;
  }
}
export function queryString(params: object = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  }
  const value = search.toString();
  return value ? "?" + value : "";
}

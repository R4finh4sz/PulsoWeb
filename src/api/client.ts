import { API_BASE_URL } from "./config";
import { useAuthState } from "@/integrations/auth/state";
export class ApiError extends Error {
  constructor(public status: number, message: string, public errors: string[] = []) { super(message); this.name = "ApiError"; }
}
type Options = Omit<RequestInit, "body"> & { body?: unknown; responseType?: "blob" };
const publicAuthPaths = new Set([
  "/auth/login",
  "/auth/password-reset/request",
  "/auth/password-reset/verify",
  "/auth/password-reset/reset",
]);
async function send<T>(path: string, options: RequestInit, responseType?: "blob"): Promise<T> {
  const response = await fetch(API_BASE_URL + path, { ...options, credentials: "omit", cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new ApiError(response.status, problem?.detail || (response.status === 401
      ? "Sua sessão expirou. Entre novamente." : "Não foi possível concluir a solicitação."),
      Array.isArray(problem?.errors) ? problem.errors : []);
  }
  if (response.status === 204) return undefined as T;
  if (responseType === "blob") return await response.blob() as T;
  return response.json() as Promise<T>;
}
export async function apiRequest<T>(path: string, { body, responseType, ...options }: Options = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers.set("Content-Type", "application/json");
  const session = useAuthState.getState().session;
  if (session && path !== "/auth/login") headers.set("Authorization", `Bearer ${session.accessToken}`);
  const isPublicAuthPath = publicAuthPaths.has(path);
  if (isPublicAuthPath) headers.delete("Authorization");
  try {
    const result = await send<T>(path, { ...options, method, headers, body: multipart ? body : body === undefined ? undefined : JSON.stringify(body) }, responseType);
    if (session !== useAuthState.getState().session && session?.accessToken !== useAuthState.getState().session?.accessToken) {
      throw new DOMException("Sessão alterada durante a solicitação.", "AbortError");
    }
    return result;
  } catch (error) {
    if (isPublicAuthPath) throw error;
    if (error instanceof ApiError && error.status === 401 && session?.accessToken === useAuthState.getState().session?.accessToken) useAuthState.getState().setSession(null);
    throw error;
  }
}
export function queryString(params: object = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? "?" + value : "";
}

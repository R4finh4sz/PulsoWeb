import { API_BASE_URL } from "./config";
export class ApiError extends Error {
  constructor(public status: number, message: string, public errors: string[] = []) { super(message); this.name = "ApiError"; }
}
type Options = Omit<RequestInit, "body"> & { body?: unknown };
async function send<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + path, { ...options, credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new ApiError(response.status, problem?.detail || (response.status === 401
      ? "Sua sessão expirou. Entre novamente." : "Não foi possível concluir a solicitação."),
      Array.isArray(problem?.errors) ? problem.errors : []);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function apiRequest<T>(path: string, { body, ...options }: Options = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    // A fresh token also handles rotation after login/logout and in other tabs.
    const csrf = await send<{ headerName: string; token: string }>("/csrf", { signal: options.signal });
    headers.set(csrf.headerName, csrf.token);
  }
  return send<T>(path, { ...options, method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
export function queryString(params: object = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? "?" + value : "";
}

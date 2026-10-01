import { ApiError, apiRequest } from "@/api/client";
import type { User } from "../types";
import type { LoginResponse } from "./state";
export type Terms = { title: string; version: string; content: string };
export const authApi = {
  me: async (signal?: AbortSignal) => {
    try { return await apiRequest<User>("/me", { signal }); }
    catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
  },
  login: (body: { email: string; password: string }) => apiRequest<LoginResponse>("/auth/login", { method: "POST", body }),
  requestPasswordReset: (email: string) => apiRequest<void>("/auth/password-reset/request", { method: "POST", body: { email } }),
  verifyPasswordReset: (email: string, code: string) => apiRequest<void>("/auth/password-reset/verify", { method: "POST", body: { email, code } }),
  resetPassword: (email: string, code: string, password: string) => apiRequest<void>("/auth/password-reset/confirm", { method: "POST", body: { email, code, password } }),
  verify: (code: string) => apiRequest<void>("/auth/2fa/verify", { method: "POST", body: { code } }),
  resend: () => apiRequest<Pick<LoginResponse, "twoFactorRequired" | "codeExpiresAt" | "resendAvailableAt">>("/auth/2fa/resend", { method: "POST" }),
  terms: async (signal?: AbortSignal) => {
    try { return await apiRequest<Terms>("/terms", { signal }); }
    catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
  },
  createTerms: (body: Pick<Terms, "title" | "content">) => apiRequest<Terms>("/terms", { method: "POST", body }),
  updateTerms: (body: Pick<Terms, "title" | "content">) => apiRequest<Terms>("/terms", { method: "PUT", body }),
  accepted: (signal?: AbortSignal) => apiRequest<string[]>("/terms/accepted", { signal }),
  accept: (version: string) => apiRequest<void>("/terms/accept", { method: "POST", body: { version, termsAccepted: true } }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};

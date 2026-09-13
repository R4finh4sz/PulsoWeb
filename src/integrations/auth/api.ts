import { apiRequest, ApiError } from "@/api/client";
import type { User } from "../types";
export const authApi = {
  me: async (signal?: AbortSignal) => {
    try { return await apiRequest<User>("/me", { signal }); }
    catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
  },
  login: (body: { email: string; password: string }) => apiRequest<User>("/auth/login", { method: "POST", body }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};

import { apiRequest, queryString } from "@/api/client";
import type { User, UserPage, UserFilters, UserResource, CreateUser } from "../types";
export const usersApi = {
  list: (resource: UserResource, filters: UserFilters = {}, signal?: AbortSignal) =>
    apiRequest<UserPage>("/" + resource + queryString(filters), { signal }),
  get: (resource: "students" | "teachers", id: number, signal?: AbortSignal) => apiRequest<User>("/" + resource + "/" + id, { signal }),
  create: (resource: UserResource, body: CreateUser) => apiRequest<User>("/" + resource, { method: "POST", body }),
  update: (resource: "students" | "teachers", id: number, body: Partial<CreateUser>) =>
    apiRequest<User>("/" + resource + "/" + id, { method: "PATCH", body }),
};

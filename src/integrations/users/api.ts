import { apiRequest, queryString } from "@/api/client";
import type {
  User,
  UserPage,
  UserFilters,
  UserResource,
  CreateUser,
} from "../types";
export const usersApi = {
  list: (
    resource: UserResource,
    filters: UserFilters = {},
    signal?: AbortSignal,
  ) => apiRequest<UserPage | User[]>("/" + resource + queryString(filters), { signal }).then((response): UserPage => {
    if (Array.isArray(response)) return {
      content: response,
      page: 0,
      size: response.length,
      totalElements: response.length,
      totalPages: response.length ? 1 : 0,
    };
    if (response && Array.isArray(response.content)) return response;
    throw new Error("Formato inválido na lista de usuários.");
  }),
  get: (resource: "students" | "teachers", id: number, signal?: AbortSignal) =>
    apiRequest<User>("/" + resource + "/" + id, { signal }),
  create: (resource: UserResource, body: CreateUser) =>
    apiRequest<User>("/" + resource, { method: "POST", body }),
  update: (
    resource: "students" | "teachers",
    id: number,
    body: Partial<CreateUser>,
  ) => apiRequest<User>("/" + resource + "/" + id, { method: "PATCH", body }),
};

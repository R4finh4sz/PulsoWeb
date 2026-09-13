"use client";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "./api";
import type { UserFilters, UserResource } from "../types";
export function useUsers(resource: UserResource, filters: UserFilters = {}, enabled = true) {
  return useQuery({ queryKey: ["users", resource, filters], queryFn: ({ signal }) => usersApi.list(resource, filters, signal), enabled });
}

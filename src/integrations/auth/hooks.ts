"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
export function useMe() { return useQuery({ queryKey: ["session"], queryFn: ({ signal }) => authApi.me(signal), retry: false }); }
export function useLogin() {
  const client = useQueryClient();
  return useMutation({ mutationFn: authApi.login, onSuccess: async (user) => {
    await client.cancelQueries(); client.clear(); client.setQueryData(["session"], user);
  } });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({ mutationFn: authApi.logout, onSuccess: async () => {
    await client.cancelQueries(); client.clear(); client.setQueryData(["session"], null);
  } });
}

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { useAuthState } from "./state";
export function useMe() { return useQuery({ queryKey: ["session"], queryFn: ({ signal }) => authApi.me(signal), retry: false }); }
export function useLogin() {
  const client = useQueryClient();
  return useMutation({ mutationFn: authApi.login, onMutate: async () => {
    useAuthState.getState().setSession(null);
    await client.cancelQueries(); client.clear();
    sessionStorage.removeItem("pulso-demo-session");
  }, onSuccess: (session) => {
    useAuthState.getState().setSession(session);
  } });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({ mutationFn: authApi.logout, onSettled: async () => {
    useAuthState.getState().setSession(null);
    await client.cancelQueries(); client.clear(); client.setQueryData(["session"], null);
  } });
}

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { useAuthState } from "./state";
export function useMe() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async ({ signal }) => {
      const user = await authApi.me(signal);
      const session = useAuthState.getState().session;
      if (user && session) useAuthState.getState().setSession({ ...session, user: { ...session.user, schoolId: user.schoolId ?? null, activeSchoolId: user.activeSchoolId, schoolIds: user.schoolIds } });
      return user;
    },
    retry: false,
  });
}
export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onMutate: async () => {
      useAuthState.getState().setSession(null);
      await client.cancelQueries();
      client.clear();
      sessionStorage.removeItem("pulso-demo-session");
    },
    onSuccess: (session) => {
      useAuthState.getState().setSession(session);
    },
  });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      useAuthState.getState().setSession(null);
      await client.cancelQueries();
      client.clear();
      client.setQueryData(["session"], null);
    },
  });
}

export function useActiveSchool() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (schoolId: number) => {
      await client.cancelQueries();
      await authApi.activeSchool(schoolId);
      const user = await authApi.me();
      if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
      const session = useAuthState.getState().session;
      if (session) useAuthState.getState().setSession({ ...session, user: { ...session.user, schoolIds: user.schoolIds, activeSchoolId: user.activeSchoolId, schoolId: user.schoolId ?? null } });
      client.setQueryData(["session"], user);
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== "session" && query.queryKey[0] !== "schools" });
      await client.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "session" });
      return user;
    },
  });
}

export function useActiveSchool() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (schoolId: number) => {
      await client.cancelQueries();
      await authApi.activeSchool(schoolId);
      const user = await authApi.me();
      if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
      const session = useAuthState.getState().session;
      if (session) useAuthState.getState().setSession({ ...session, user: { ...session.user, schoolIds: user.schoolIds, activeSchoolId: user.activeSchoolId, schoolId: user.schoolId ?? null } });
      client.setQueryData(["session"], user);
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== "session" && query.queryKey[0] !== "schools" });
      await client.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "session" });
      return user;
    },
  });
}

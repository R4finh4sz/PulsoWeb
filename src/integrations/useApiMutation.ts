"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Refresh affected server state even when a multi-step action only partially succeeds.
export function useApiMutation<T, V>(mutationFn: (variables: V) => Promise<T>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, retry: false, onSettled: async () => {
    await Promise.all(["users", "classrooms", "subjects"].map(key => client.invalidateQueries({ queryKey: [key] })));
  } });
}

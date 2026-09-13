"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackStore } from "@/store/feedbackStore";
// Refresh affected server state even when a multi-step action only partially succeeds.
export function useApiMutation<T, V>(mutationFn: (variables: V) => Promise<T>) {
  const client = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);
  return useMutation({ mutationFn, retry: false, onSettled: async () => {
    await Promise.all(["users", "classrooms", "subjects"].map(key => client.invalidateQueries({ queryKey: [key] })));
  }, onSuccess: () => showFeedback({ type: "success", message: "Operação concluída com sucesso." }),
  onError: (error) => showFeedback({ type: "error", message: error instanceof Error ? error.message : "Não foi possível concluir a operação." }) });
}

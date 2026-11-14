import { create } from "zustand";

type FeedbackType = "error" | "success";
type FeedbackState = {
  feedback: {
    type: FeedbackType;
    title: string;
    message: string;
    onClose?: () => void;
  } | null;
  showFeedback: (feedback: {
    type: FeedbackType;
    title?: string;
    message: string;
    onClose?: () => void;
  }) => void;
  closeFeedback: () => void;
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: null,
  showFeedback: ({ type, title, message, onClose }) =>
    set({
      feedback: {
        type,
        title: title ?? (type === "success" ? "Sucesso" : "Dados incorretos"),
        message,
        onClose,
      },
    }),
  closeFeedback: () => {
    const onClose = get().feedback?.onClose;
    set({ feedback: null });
    onClose?.();
  },
}));

export function showRequestError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") return;
  const message =
    error instanceof TypeError
      ? "Não foi possível conectar ao servidor. Tente novamente em instantes."
      : error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Não foi possível concluir a solicitação.";
  const details =
    error instanceof Error && "errors" in error && Array.isArray(error.errors)
      ? error.errors.filter(
          (detail): detail is string => typeof detail === "string",
        )
      : [];
  const formatted = [...new Set([message, ...details])].join("\n");
  const current = useFeedbackStore.getState().feedback;
  if (current?.type === "error" && current.message.includes(formatted)) return;
  useFeedbackStore
    .getState()
    .showFeedback({
      type: "error",
      title: "Erro",
      message:
        current?.type === "error"
          ? `${current.message}\n\n${formatted}`
          : formatted,
    });
}

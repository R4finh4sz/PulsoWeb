import { create } from "zustand";

type FeedbackType = "error" | "success";
type FeedbackState = {
  feedback: { type: FeedbackType; title: string; message: string; onClose?: () => void } | null;
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

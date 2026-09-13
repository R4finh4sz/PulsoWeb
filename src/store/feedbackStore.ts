import { create } from "zustand";

type FeedbackType = "error" | "success";
type FeedbackState = {
  feedback: { type: FeedbackType; title: string; message: string } | null;
  showFeedback: (feedback: { type: FeedbackType; title?: string; message: string }) => void;
  closeFeedback: () => void;
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  feedback: null,
  showFeedback: ({ type, title, message }) => set({ feedback: { type, title: title ?? (type === "success" ? "Sucesso" : "Dados incorretos"), message } }),
  closeFeedback: () => set({ feedback: null }),
}));

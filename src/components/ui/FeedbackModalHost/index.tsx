"use client";

import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useEffect, useId, useRef } from "react";

export function FeedbackModalHost() {
  const feedback = useFeedbackStore((state) => state.feedback);
  const closeFeedback = useFeedbackStore((state) => state.closeFeedback);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (feedback && !dialog.current?.open) dialog.current?.showModal();
  }, [feedback]);
  if (!feedback) return null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        closeFeedback();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-white p-0 backdrop:bg-black/70"
    >
      <FeedbackModalContent
        type={feedback.type}
        title={feedback.title}
        titleId={titleId}
        message={
          <div
            role={feedback.type === "error" ? "alert" : undefined}
            className="whitespace-pre-line break-words"
          >
            {feedback.message}
          </div>
        }
        actionLabel={feedback.type === "error" ? "Entendi" : "Fechar"}
        autoFocusAction
        onClose={closeFeedback}
      />
    </dialog>
  );
}

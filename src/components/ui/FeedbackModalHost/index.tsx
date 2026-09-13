"use client";

import { FeedbackModal } from "@/components/ui/FeedbackModal";
import { useFeedbackStore } from "@/store/feedbackStore";

export function FeedbackModalHost() {
  const feedback = useFeedbackStore((state) => state.feedback);
  const closeFeedback = useFeedbackStore((state) => state.closeFeedback);
  if (!feedback) return null;
  return <FeedbackModal type={feedback.type} title={feedback.title} message={feedback.message} onClose={closeFeedback} />;
}

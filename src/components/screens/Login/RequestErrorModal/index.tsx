"use client";

import { useEffect } from "react";
import { showRequestError } from "@/store/feedbackStore";

export function RequestErrorModal({ error }: { error: Error | string | null }) {
  useEffect(() => {
    if (error) showRequestError(error);
  }, [error]);
  return null;
}

"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

type FeedbackModalProps = {
  type: "error" | "success";
  title: string;
  message: ReactNode;
  onClose: () => void;
  actionLabel?: string;
};

export function FeedbackModal({ type, title, message, onClose, actionLabel }: FeedbackModalProps) {
  const success = type === "success";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5" role="presentation">
    <div role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="w-full max-w-[528px] rounded-[20px] bg-white px-10 py-10 text-center shadow-2xl">
      <div className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full ${success ? "bg-[#a9dfb1] text-[#5a873d]" : "bg-[#fac4c1] text-[#e63e32]"}`}>
        {success ? <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} /> : <AlertTriangle className="h-10 w-10" strokeWidth={2.5} />}
      </div>
      <h2 id="feedback-title" className="mt-8 text-[26px] font-semibold text-[#22232a]">{title}</h2>
      <div className="mt-8 text-[21px] leading-[1.55] text-[#55565b]">{message}</div>
      <button type="button" onClick={onClose} className={`mt-8 min-h-16 w-full rounded-xl px-5 text-xl font-semibold text-white ${success ? "bg-[#5d8c3e]" : "bg-[#e83e32]"}`}>
        {actionLabel ?? (success ? "Fechar" : "Tentar novamente")}
      </button>
    </div>
  </div>;
}
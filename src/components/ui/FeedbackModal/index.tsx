"use client";

import { AlertTriangle, CheckCircle2, UserPlus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type FeedbackModalProps = {
  type: "error" | "success" | "invitation";
  title: string;
  message: ReactNode;
  onClose: () => void;
  actionLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
  autoFocusAction?: boolean;
  icon?: LucideIcon;
  error?: ReactNode;
  disabled?: boolean;
};

export function FeedbackModalContent({
  type,
  title,
  message,
  onClose,
  actionLabel,
  secondaryAction,
  autoFocusAction,
  icon: InvitationIcon = UserPlus,
  error,
  disabled = false,
  titleId = "feedback-title",
}: FeedbackModalProps & { titleId?: string }) {
  const success = type === "success";
  const invitation = type === "invitation";
  return (
    <div className="w-full max-w-[528px] rounded-[20px] bg-white px-6 py-10 text-center shadow-2xl sm:px-10">
      <div
        className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full ${invitation ? "bg-[#e8f7fa] text-(--blue-dark)" : success ? "bg-[#a9dfb1] text-[#5a873d]" : "bg-[#fac4c1] text-[#e63e32]"}`}
      >
        {invitation ? (
          <InvitationIcon aria-hidden="true" className="h-10 w-10" strokeWidth={2} />
        ) : success ? (
          <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />
        ) : (
          <AlertTriangle className="h-10 w-10" strokeWidth={2.5} />
        )}
      </div>
      <h2
        id={titleId}
        className="mt-8 text-[26px] font-semibold text-[#22232a]"
      >
        {title}
      </h2>
      <div className="mt-8 text-[21px] leading-[1.55] text-[#55565b]">
        {message}
      </div>
      {error && <div className="mt-4 text-left text-sm text-red-700">{error}</div>}
      <div
        className={`mt-8 grid gap-3 ${secondaryAction ? "grid-cols-2" : "grid-cols-1"}`}
      >
        <button
          type="button"
          disabled={disabled}
          autoFocus={autoFocusAction}
          onClick={onClose}
          className={`min-h-16 min-w-0 w-full rounded-xl px-3 py-3 ${secondaryAction ? "text-sm sm:text-base" : "text-xl"} font-semibold text-white ${invitation ? "bg-[var(--blue-dark)]" : success ? "bg-[#5d8c3e]" : "bg-[#e83e32]"}`}
        >
          {actionLabel ?? (success ? "Fechar" : "Tentar novamente")}
        </button>
        {secondaryAction && (
          <button
            type="button"
            disabled={disabled}
            onClick={secondaryAction.onClick}
            className="min-h-16 min-w-0 w-full rounded-xl border border-(--line) px-3 py-3 text-sm font-semibold text-[#55565b] hover:bg-slate-50 sm:text-base"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function FeedbackModal(props: FeedbackModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-[528px]"
      >
        <FeedbackModalContent {...props} />
      </div>
    </div>
  );
}

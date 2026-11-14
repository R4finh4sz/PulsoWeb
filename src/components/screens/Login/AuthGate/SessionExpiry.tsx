"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";

export function SessionExpiry({ expiresAt, expiring = false }: { expiresAt: string; expiring?: boolean }) {
  const [warning, setWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const check = () => {
      const remaining = Date.parse(expiresAt) - Date.now();
      setWarning(remaining > 0 && (expiring || remaining <= 60_000));
    };
    check();
    const timer = setTimeout(check, Math.min(Math.max(0, Date.parse(expiresAt) - Date.now() - 60_000), 2147483647));
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [expiresAt, expiring]);
  useEffect(() => {
    if (warning && !dismissed) dialog.current?.showModal();
  }, [warning, dismissed]);
  if (!warning || dismissed) return null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="session-expiry-title"
      onCancel={(event) => { event.preventDefault(); setDismissed(true); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-white p-0 backdrop:bg-black/70"
    >
      <FeedbackModalContent
        type="invitation"
        icon={Clock}
        title="Sua sessão está terminando"
        titleId="session-expiry-title"
        message="Sua sessão termina em até 1 minuto. Salve o que estiver fazendo. Se ela expirar, entre novamente para continuar."
        actionLabel="Entendi"
        autoFocusAction
        onClose={() => setDismissed(true)}
      />
    </dialog>
  );
}

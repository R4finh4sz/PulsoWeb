"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, UserPlus, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { demoTeacherNotifications } from "@/mocks/notifications";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import { useAuthState } from "@/integrations/auth/state";
import { useNotificationStore } from "@/store/notificationStore";

export function TeacherNotifications({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const token = useAuthState((state) => state.session?.accessToken);
  const notifications =
    mockAccessEnabled && getDemoUser(token)?.role === "TEACHER"
      ? demoTeacherNotifications
      : [];
  const responses = useNotificationStore((state) => state.responses);
  const respond = useNotificationStore((state) => state.respond);
  const invitation = notifications.find(
    (notification) => notification.id === selected,
  );
  const pendingInvitations = notifications.filter(
    (notification) => !responses[`${userId}:${notification.id}`],
  );
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  function closeInvitation() {
    dialog.current?.close();
    setSelected(null);
    trigger.current?.focus();
  }
  function answer(value: "ACCEPTED" | "REJECTED") {
    if (selected) respond(userId, selected, value);
    closeInvitation();
  }
  const unread = pendingInvitations.length;
  useEffect(() => {
    if (!open) return;
    function outside(event: MouseEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("click", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={`Notificações${unread ? `, ${unread} convite pendente` : ""}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-cyan-50"
      >
        <Bell size={21} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e83e32] ring-2 ring-white"
          />
        )}
      </button>
      {open && (
        <section
          id={id}
          aria-label="Notificações do professor"
          className="absolute right-0 top-full z-30 mt-3 max-h-[70dvh] w-[min(360px,calc(100vw-40px))] overflow-y-auto rounded-2xl border border-(--line) bg-white shadow-xl max-sm:fixed max-sm:left-5 max-sm:right-5 max-sm:top-20 max-sm:w-auto"
        >
          <div className="flex items-center justify-between border-b border-(--line) px-5 py-3">
            <h2 className="text-base font-semibold">Notificações</h2>
            <button
              type="button"
              aria-label="Fechar notificações"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-(--muted) hover:bg-slate-50"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {!pendingInvitations.length ? (
            <EmptyState icon={Bell} title="Nenhum convite pendente" />
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {pendingInvitations.map((notification) => {
                return (
                  <li key={notification.id} className="bg-cyan-50/50 p-5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setSelected(notification.id);
                      }}
                      className="flex w-full items-start gap-3 rounded-lg text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)">
                        <UserPlus size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {notification.title}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-(--muted)">
                          {notification.message}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-invitation-title`}
        onCancel={(event) => {
          event.preventDefault();
          closeInvitation();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-white p-0 backdrop:bg-black/70"
      >
        {invitation && (
          <>
            <button
              type="button"
              aria-label="Fechar convite"
              onClick={closeInvitation}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-(--muted) hover:bg-slate-50"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <FeedbackModalContent
              type="invitation"
              titleId={`${id}-invitation-title`}
              title={invitation.title}
              message={invitation.message}
              actionLabel="Aceitar"
              onClose={() => answer("ACCEPTED")}
              secondaryAction={{
                label: "Negar",
                onClick: () => answer("REJECTED"),
              }}
            />
          </>
        )}
      </dialog>
    </div>
  );
}

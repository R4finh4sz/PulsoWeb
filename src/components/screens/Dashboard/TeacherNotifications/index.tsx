"use client";

import { ErrorMessage } from "@/components/screens/Integration/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { useAuthState } from "@/integrations/auth/state";
import { notificationsApi } from "@/integrations/notifications/api";
import { schoolsApi } from "@/integrations/schools/api";
import { subjectsApi } from "@/integrations/subjects/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, School, UserPlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function TeacherNotifications({
  userId,
  dark = false,
}: {
  userId: string;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const token = useAuthState((state) => state.session?.accessToken);
  const client = useQueryClient();
  const authenticated = !!token;
  const query = useQuery({
    queryKey: ["subject-invitations", userId],
    queryFn: ({ signal }) => subjectsApi.invitations(signal),
    enabled: authenticated,
    refetchInterval: 30000,
  });
  const schoolQuery = useQuery({
    queryKey: ["school-invitations", userId],
    queryFn: ({ signal }) => schoolsApi.invitations(signal),
    enabled: authenticated,
    refetchInterval: 30000,
  });
  const notifications = useQuery({ queryKey: ["notifications", userId], queryFn: ({ signal }) => notificationsApi.list(signal), enabled: authenticated, refetchInterval: 30000 });
  const read = useMutation({ mutationFn: notificationsApi.read, onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
  const pendingInvitations = [
    ...(authenticated ? (query.data ?? []) : []).map((invite) => ({
      ...invite,
      kind: "subject" as const,
      key: "subject:" + invite.id,
      title: "Convite para uma matéria",
      message:
        invite.inviterName +
        " convidou você para participar de " +
        invite.subjectName +
        ".",
    })),
    ...(authenticated ? (schoolQuery.data ?? []) : []).map((invite) => ({
      ...invite,
      kind: "school" as const,
      key: "school:" + invite.id,
      title: "Convite para uma escola",
      message:
        invite.inviterName +
        " convidou você para se vincular à escola " +
        invite.schoolName +
        ".",
    })),
  ];
  const invitation = pendingInvitations.find(
    (notification) => notification.key === selected,
  );
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  function closeInvitation() {
    dialog.current?.close();
    setSelected(null);
    trigger.current?.focus();
  }
  const response = useMutation({
    mutationFn: async ({
      id,
      kind,
      status,
    }: {
      id: number;
      kind: "subject" | "school";
      status: "ACCEPTED" | "REJECTED";
    }) => {
      if (kind === "school") await schoolsApi.respond(id, status);
      else await subjectsApi.respond(id, status);
    },
    onSuccess: async () => {
      closeInvitation();
      await Promise.all(
        [
          ["subject-invitations"],
          ["school-invitations"],
          ["teacher-profile"],
          ["subjects"],
          ["classrooms"],
          ["schools"],
          ["session"],
          ["notifications"],
        ].map((queryKey) => client.invalidateQueries({ queryKey })),
      );
    },
  });
  function answer(value: "ACCEPTED" | "REJECTED") {
    if (invitation && !response.isPending)
      response.mutate({
        id: invitation.id,
        kind: invitation.kind,
        status: value,
      });
  }
  const unread = (notifications.data ?? []).filter((item) => !item.read && !item.readAt).length || pendingInvitations.length;
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
        aria-label={`Notificações${unread ? `, ${unread} ${unread === 1 ? "convite pendente" : "convites pendentes"}` : ""}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${dark ? "text-[#d8e9ee] hover:bg-[#245362] focus-visible:outline-white" : "text-slate-600 hover:bg-cyan-50"}`}
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
          <ErrorMessage error={notifications.error || read.error} />
          <ul>{notifications.data?.map((item) => <li key={`${item.type}:${item.id}`} className="border-b p-4"><button type="button" disabled={read.isPending || item.read || !!item.readAt} onClick={() => read.mutate(item.readUrl)} className="text-left"><span className="block font-medium">{item.title ?? (item.type.toUpperCase().includes("SCHOOL") ? "Notificação de escola" : "Notificação de matéria")}</span><span className="text-sm">{item.message}</span><span className="block text-xs">{item.read || item.readAt ? "Lida" : "Marcar como lida"}</span></button></li>)}</ul>
          {(query.error || schoolQuery.error) && (
            <ErrorMessage error={query.error || schoolQuery.error} />
          )}
          {(query.isPending || schoolQuery.isPending) && authenticated ? (
            <p role="status" className="p-5 text-sm">
              Carregando convites…
            </p>
          ) : !pendingInvitations.length ? (
            <EmptyState icon={Bell} title="Nenhum convite pendente" />
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {pendingInvitations.map((notification) => {
                const Icon = notification.kind === "school" ? School : UserPlus;
                return (
                  <li key={notification.key} className="bg-cyan-50/50 p-5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        response.reset();
                        setSelected(notification.key);
                      }}
                      className="flex w-full items-start gap-3 rounded-lg text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)">
                        <Icon size={18} aria-hidden="true" />
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
          if (!response.isPending) closeInvitation();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-white p-0 backdrop:bg-black/70"
      >
        {invitation && (
          <>
            <button
              type="button"
              disabled={response.isPending}
              aria-label="Fechar convite"
              onClick={closeInvitation}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-(--muted) hover:bg-slate-50"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <FeedbackModalContent
              type="invitation"
              icon={invitation.kind === "school" ? School : UserPlus}
              disabled={response.isPending}
              error={
                response.error ? (
                  <ErrorMessage error={response.error} />
                ) : undefined
              }
              titleId={`${id}-invitation-title`}
              title={invitation.title}
              message={invitation.message}
              actionLabel={response.isPending ? "Registrando…" : "Aceitar"}
              onClose={() => answer("ACCEPTED")}
              secondaryAction={{
                label: "Negar",
                destructive: true,
                onClick: () => answer("REJECTED"),
              }}
            />
          </>
        )}
      </dialog>
    </div>
  );
}

"use client";

import { canAccessSubject } from "@/utils/subjectAccess";
import { SubjectThemes } from "../SubjectThemes";

import {
  actionClass,
  ErrorMessage,
  fieldClass,
} from "@/components/screens/Integration/shared";
import { useMe } from "@/integrations/auth/hooks";
import { useAuthState } from "@/integrations/auth/state";
import { subjectsApi } from "@/integrations/subjects/api";
import type { Subject } from "@/integrations/types";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, LockKeyhole, MoreHorizontal, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function SubjectCard({
  subject,
  viewerId,
}: {
  subject: Subject;
  viewerId?: number;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [showThemes, setShowThemes] = useState(false);
  const token = useAuthState((state) => state.session?.accessToken);
  const authenticated = !!token;
  const me = useMe();
  const teacherId = viewerId ?? me.data?.id ?? NaN;
  const locked = !canAccessSubject(subject, teacherId);
  const owner = subject.teacherId === teacherId;
  const invitation = useMutation({
    mutationFn: () =>
      subjectsApi.invite(
        subject.classroomId,
        subject.id,
        email.trim().toLowerCase(),
      ),
  });
  useEffect(() => {
    function close(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !menu.current?.contains(event.target) &&
        menu.current
      )
        menu.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        trigger.current?.focus();
      }
    }
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  function closeDialog() {
    if (!invitation.isPending) dialog.current?.close();
  }
  if (locked)
    return (
      <div
        role="group"
        aria-label={subject.name + " — Acesso bloqueado"}
        aria-disabled="true"
        className="h-full cursor-not-allowed rounded-2xl border border-(--line) bg-slate-50 p-7"
      >
        <LockKeyhole
          size={24}
          aria-hidden="true"
          className="mb-5 text-slate-500"
        />
        <h3 className="break-words text-base font-semibold">{subject.name}</h3>
        <p className="mt-2 text-sm text-(--muted)">
          Acesso bloqueado. Aceite o convite do professor responsável para
          participar.
        </p>
      </div>
    );
  return (
    <>
      <div className="choice-card relative h-full">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)"
          >
            <BookOpen size={24} strokeWidth={1.7} />
          </span>
          <details ref={menu} className="relative z-10">
            <summary
              ref={(node) => {
                trigger.current = node;
              }}
              aria-label={`Opções de ${subject.name}`}
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-(--muted) hover:bg-cyan-50 [&::-webkit-details-marker]:hidden"
            >
              <MoreHorizontal size={22} aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-(--line) bg-white p-1.5 shadow-lg">
              {owner && (
                <button
                  type="button"
                  onClick={() => {
                    if (menu.current) menu.current.open = false;
                    invitation.reset();
                    setEmail("");
                    dialog.current?.showModal();
                  }}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-(--ink) hover:bg-cyan-50"
                >
                  <UserPlus size={17} aria-hidden="true" />
                  Adicionar professor
                </button>
              )}
            </div>
          </details>
        </div>
        <Link
          href={`/teacher/classrooms/${subject.classroomId}/subjects/${subject.id}`}
          className="after:absolute after:inset-0 after:rounded-2xl"
        >
          <h3 className="break-words text-base font-semibold">
            {subject.name}
          </h3>
          <p className="mt-2 text-sm text-(--muted)">
            Ver quizzes e criar atividades
          </p>
        </Link>
      </div>
      {showThemes && (
        <SubjectThemes
          subject={subject}
          onClose={() => {
            setShowThemes(false);
            trigger.current?.focus();
          }}
        />
      )}
      <dialog
        ref={dialog}
        aria-labelledby={`subject-invite-${subject.id}`}
        onCancel={(event) => {
          if (invitation.isPending) event.preventDefault();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-white px-6 py-10 text-center shadow-2xl backdrop:bg-black/70 sm:px-10"
      >
        <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)">
          <UserPlus size={36} aria-hidden="true" />
        </span>
        <h2
          id={`subject-invite-${subject.id}`}
          className="mt-6 text-[26px] font-semibold"
        >
          Adicionar professor
        </h2>
        <p className="mt-3 break-words text-sm leading-6 text-(--muted)">
          Convide um professor para participar de {subject.name}.
        </p>
        {invitation.isSuccess ? (
          <div className="mt-6 space-y-5">
            <p role="status" className="break-words text-sm text-emerald-800">
              Convite criado para {invitation.data.email}.
            </p>
            <button
              type="button"
              onClick={closeDialog}
              className={`${actionClass} w-full`}
            >
              Fechar
            </button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-5 text-left"
            onSubmit={(event) => {
              event.preventDefault();
              if (!invitation.isPending && authenticated) invitation.mutate();
            }}
          >
            <label className="block text-sm font-medium">
              E-mail do professor
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={invitation.isPending}
                className={fieldClass}
                placeholder="professor@escola.com"
              />
            </label>
            {!authenticated && (
              <p className="text-sm text-(--muted)">
                Convites para matérias ainda não estão disponíveis neste
                ambiente.
              </p>
            )}
            <ErrorMessage error={invitation.error} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeDialog}
                disabled={invitation.isPending}
                className="min-h-12 rounded-xl border border-(--line) px-3 text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={invitation.isPending || !authenticated}
                className={actionClass}
              >
                {invitation.isPending ? "Convidando…" : "Convidar professor"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

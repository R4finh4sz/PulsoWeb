"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  ErrorMessage,
  Protected,
  actionClass,
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import Input from "@/components/ui/Input";
import { useAuthState } from "@/integrations/auth/state";
import { profileApi, type ChangePassword } from "@/integrations/profile/api";
import type { SessionUser } from "@/interfaces/auth";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  LockKeyhole,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

function Profile({ user }: { user: SessionUser }) {
  const token = useAuthState((state) => state.session?.accessToken);
  const demo = mockAccessEnabled && !!getDemoUser(token);
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: ["teacher-profile", user.id],
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: demo,
  });
  const [active, setActive] = useState<"password" | "deletion">("password");
  const dialog = useRef<HTMLDialogElement>(null);
  const password = useMutation({ mutationFn: profileApi.changePassword });
  const deletion = useMutation({
    mutationFn: profileApi.requestDeletion,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["teacher-profile", user.id] }),
  });
  const download = useMutation({
    mutationFn: async () => {
      const data = await profileApi.export();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "meus-dados-pulso.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
  const busy = password.isPending || deletion.isPending;
  function open(value: "password" | "deletion") {
    setActive(value);
    password.reset();
    deletion.reset();
    dialog.current?.showModal();
  }
  function close() {
    if (!busy) dialog.current?.close();
  }
  const optionClass =
    "flex min-h-16 w-full items-center gap-4 rounded-xl border border-(--line) bg-white px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-cyan-50 disabled:opacity-50";
  return (
    <div className="space-y-8">
      <BackLink />
      <h1 className="page-title">Meu perfil</h1>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-8">
          <div className="text-center">
            <span
              aria-hidden="true"
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#dff2f6] text-3xl font-semibold text-(--blue-dark)"
            >
              {user.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </span>
            <h2 className="mt-5 break-words text-xl font-semibold">
              {user.name}
            </h2>
          </div>
          <section
            aria-label="Dados do professor"
            className="space-y-4 border-0 rounded-2xl bg-[#e8faff] px-5 py-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">Dados do professor</h2>
            {demo && profile.isPending ? (
              <p role="status">Carregando dados…</p>
            ) : (
              <>
                <ErrorMessage error={profile.error} />
                {profile.isError && (
                  <button
                    className={actionClass}
                    onClick={() => profile.refetch()}
                  >
                    Tentar novamente
                  </button>
                )}
                {profile.data && (
                  <dl className="divide-y divide-blue-200 rounded-2xl bg-[#e8faff] px-5">
                    <div className="flex gap-3 py-5">
                      <GraduationCap
                        size={21}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-(--blue-dark)"
                      />
                      <div className="min-w-0">
                        <dt className="text-xs text-(--muted)">Escolas</dt>
                        <dd className="mt-1 space-y-1 text-sm">
                          {profile.data.schools.length
                            ? profile.data.schools.map((school) => (
                                <p key={school.id} className="break-words">
                                  {school.nome}
                                </p>
                              ))
                            : "Nenhuma escola vinculada"}
                        </dd>
                      </div>
                    </div>
                    <div className="flex gap-3 py-5">
                      <BadgeCheck
                        size={21}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-(--blue-dark)"
                      />
                      <div>
                        <dt className="text-xs text-(--muted)">Matrícula</dt>
                        <dd className="mt-1 text-sm">
                          {profile.data.user.ra || "Não informada"}
                        </dd>
                      </div>
                    </div>
                  </dl>
                )}
              </>
            )}
          </section>
        </div>
        <section aria-label="Conta" className="space-y-4">
          <h2 className="text-lg font-semibold">Conta</h2>
          <button
            type="button"
            disabled={!demo}
            onClick={() => open("password")}
            className={optionClass}
          >
            <LockKeyhole size={21} aria-hidden="true" />
            Alterar senha
            <ChevronRight size={18} className="ml-auto" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={!demo || download.isPending}
            onClick={() => download.mutate()}
            className={optionClass}
          >
            <Download size={21} aria-hidden="true" />
            {download.isPending ? "Exportando…" : "Exportação de dados"}
            <ChevronRight size={18} className="ml-auto" aria-hidden="true" />
          </button>
          <Link href="/teacher/terms" className={optionClass}>
            <FileText size={21} aria-hidden="true" />
            Termos de uso
            <ChevronRight size={18} className="ml-auto" aria-hidden="true" />
          </Link>
          <button
            type="button"
            disabled={!demo || profile.data?.deletionRequested}
            onClick={() => open("deletion")}
            className={optionClass}
          >
            <Trash2 size={21} aria-hidden="true" />
            {profile.data?.deletionRequested
              ? "Exclusão solicitada"
              : "Solicitar exclusão de conta"}
            <ChevronRight size={18} className="ml-auto" aria-hidden="true" />
          </button>
          <ErrorMessage error={download.error} />
        </section>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="profile-dialog-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-white p-0 shadow-2xl backdrop:bg-black/70"
      >
        <button
          type="button"
          disabled={busy}
          aria-label="Fechar"
          onClick={close}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-(--muted) hover:bg-slate-50"
        >
          <X size={18} />
        </button>
        {active === "deletion" ? (
          <>
            <FeedbackModalContent
              type={deletion.isSuccess ? "success" : "error"}
              titleId="profile-dialog-title"
              title={
                deletion.isSuccess
                  ? "Solicitação registrada"
                  : "Solicitar exclusão de conta?"
              }
              message={
                deletion.isSuccess
                  ? "Sua solicitação de exclusão foi registrada."
                  : "Deseja solicitar a exclusão da sua conta? A solicitação ficará pendente de análise."
              }
              actionLabel={
                deletion.isSuccess
                  ? "Fechar"
                  : deletion.isPending
                    ? "Solicitando…"
                    : "Solicitar exclusão"
              }
              onClose={
                deletion.isSuccess
                  ? close
                  : () => {
                      if (!busy) deletion.mutate();
                    }
              }
              secondaryAction={
                deletion.isSuccess
                  ? undefined
                  : { label: "Cancelar", onClick: close }
              }
            />
            <div className="px-6">
              <ErrorMessage error={deletion.error} />
            </div>
          </>
        ) : password.isSuccess ? (
          <FeedbackModalContent
            type="success"
            titleId="profile-dialog-title"
            title="Senha alterada"
            message="Sua senha foi atualizada."
            actionLabel="Fechar"
            onClose={close}
          />
        ) : (
          <form
            className="space-y-5 px-6 py-10 sm:px-10"
            onSubmit={(event) => {
              event.preventDefault();
              if (busy) return;
              const data = new FormData(event.currentTarget);
              password.mutate(Object.fromEntries(data) as ChangePassword);
            }}
          >
            <div className="mb-6 text-center">
              <LockKeyhole
                size={32}
                className="mx-auto mb-4 text-(--blue-dark)"
                aria-hidden="true"
              />
              <h2 id="profile-dialog-title" className="text-2xl font-semibold">
                Alterar senha
              </h2>
              <p className="mt-3 text-sm text-(--muted)">
                Use pelo menos 8 caracteres, incluindo letras e números.
              </p>
            </div>
            <fieldset disabled={busy} className="space-y-5">
              <Input
                id="currentPassword"
                name="currentPassword"
                label="Senha atual"
                type="password"
                required
                autoComplete="current-password"
              />
              <Input
                id="newPassword"
                name="newPassword"
                label="Nova senha"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar nova senha"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </fieldset>
            <ErrorMessage error={password.error} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={close}
                className="min-h-12 rounded-xl border border-(--line) text-sm font-medium"
              >
                Cancelar
              </button>
              <button type="submit" disabled={busy} className={actionClass}>
                {busy ? "Salvando…" : "Salvar senha"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}

export function TeacherProfileScreen() {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          <Profile user={user} />
        </TeacherShell>
      )}
    </Protected>
  );
}

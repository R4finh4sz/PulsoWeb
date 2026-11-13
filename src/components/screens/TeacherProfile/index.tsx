"use client";

import {
  ErrorMessage,
  actionClass,
  fieldClass,
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import Input from "@/components/ui/Input";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { useLogout } from "@/integrations/auth/hooks";
import { profileApi, type ChangePassword } from "@/integrations/profile/api";
import type { SessionUser } from "@/interfaces/auth";
import { homeRoutes } from "@/interfaces/auth";
import { showRequestError } from "@/store/feedbackStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  Download,
  FileText,
  GraduationCap,
  LockKeyhole,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TwoFactorSettings } from "./TwoFactorSettings";

export function Profile({ user }: { user: SessionUser }) {
  const admin = user.role === "admin";
  const profileLabel =
    user.role === "admin"
      ? "Dados do administrador"
      : user.role === "coordenador"
        ? "Dados do coordenador"
        : "Dados do professor";
  const client = useQueryClient();
  const router = useRouter();
  const logout = useLogout();
  const photoInput = useRef<HTMLInputElement>(null);
  const photoImage = useRef<HTMLImageElement>(null);
  const photo = useQuery({
    queryKey: ["profile-photo", user.id],
    queryFn: async ({ signal }) => (await profileApi.photo(signal)) ?? null,
    retry: false,
  });
  useEffect(() => {
    if (!photo.data || !photoImage.current) return;
    const url = URL.createObjectURL(photo.data);
    photoImage.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo.data]);
  const updatePhoto = useMutation({
    mutationFn: profileApi.updatePhoto,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["profile-photo", user.id] }),
    onError: showRequestError,
  });
  const profile = useQuery({
    queryKey: ["teacher-profile", user.id],
    queryFn: ({ signal }) => profileApi.get(signal),
  });
  const [active, setActive] = useState<"password" | "deletion">("password");
  const dialog = useRef<HTMLDialogElement>(null);
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const password = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: async () => {
      // useLogout clears the local session and cache even if the request fails.
      await logout.mutateAsync().catch(() => undefined);
      router.replace("/");
    },
  });
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
  const busy = password.isPending || deletion.isPending || logout.isPending;
  function open(value: "password" | "deletion") {
    setNewPassword("");
    setConfirmation("");
    if (admin && value === "deletion") return;
    setActive(value);
    setDeletionPassword("");
    setDeletionReason("");
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
            <div className="relative mx-auto w-fit">
              {photo.data ? (
                // The authenticated image is loaded as a local blob URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={photoImage}
                  alt="Foto de perfil"
                  className="h-44 w-44 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-[#dff2f6] text-5xl font-semibold text-(--blue-dark)"
                >
                  {user.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
              )}
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png"
                aria-label="Selecionar foto de perfil"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file && !updatePhoto.isPending) updatePhoto.mutate(file);
                }}
              />
              <button
                type="button"
                aria-label="Alterar foto de perfil"
                title="Alterar foto de perfil"
                disabled={updatePhoto.isPending}
                onClick={() => photoInput.current?.click()}
                className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border border-(--line) bg-white text-(--blue-dark) shadow-sm hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              >
                <Pencil size={18} aria-hidden="true" />
              </button>
            </div>
            {updatePhoto.isPending && (
              <p role="status" className="mt-2 text-sm text-(--muted)">
                Atualizando foto…
              </p>
            )}
            <h2 className="mt-5 break-words text-xl font-semibold">
              {user.name}
            </h2>
          </div>
          <section
            aria-label={profileLabel}
            className="space-y-4 border-0 rounded-2xl bg-[#e8faff] px-5 py-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{profileLabel}</h2>
            {profile.isPending ? (
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
                    {admin ? (
                      [
                        {
                          label: "Nome completo",
                          value: profile.data.user.fullName,
                          Icon: UserRound,
                        },
                        {
                          label: "E-mail",
                          value: profile.data.user.email,
                          Icon: Mail,
                        },
                        {
                          label: "Perfil de acesso",
                          value: "Administrador",
                          Icon: ShieldCheck,
                        },
                      ].map(({ label, value, Icon }) => (
                        <div key={label} className="flex gap-3 py-5">
                          <Icon
                            size={21}
                            aria-hidden="true"
                            className="mt-1 shrink-0 text-(--blue-dark)"
                          />
                          <div className="min-w-0">
                            <dt className="text-xs text-(--muted)">{label}</dt>
                            <dd className="mt-1 break-words text-sm">
                              {value}
                            </dd>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
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
                                      {"nome" in school
                                        ? school.nome
                                        : school.name}
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
                            <dt className="text-xs text-(--muted)">
                              Matrícula
                            </dt>
                            <dd className="mt-1 text-sm">
                              {profile.data.user.ra || "Não informada"}
                            </dd>
                          </div>
                        </div>
                      </>
                    )}
                  </dl>
                )}
              </>
            )}
          </section>
        </div>
        <section aria-label="Conta" className="space-y-4">
          <h2 className="text-lg font-semibold">Conta</h2>
          <TwoFactorSettings />
          <Link href={`${homeRoutes[user.role]}/faq`} className={optionClass}>
            <CircleHelp size={21} aria-hidden="true" />
            FAQ - Perguntas frequentes
            <ArrowRight size={18} className="ml-auto" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => open("password")}
            className={optionClass}
          >
            <LockKeyhole size={21} aria-hidden="true" />
            Alterar senha
            <ArrowRight size={18} className="ml-auto" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={download.isPending}
            onClick={() => download.mutate()}
            className={optionClass}
          >
            <Download size={21} aria-hidden="true" />
            {download.isPending ? "Exportando…" : "Exportação de dados"}
            <ArrowRight size={18} className="ml-auto" aria-hidden="true" />
          </button>
          <Link href={`${homeRoutes[user.role]}/terms`} className={optionClass}>
            <FileText size={21} aria-hidden="true" />
            Termos de uso
            <ArrowRight size={18} className="ml-auto" aria-hidden="true" />
          </Link>
          {!admin && (
            <button
              type="button"
              disabled={
                profile.isPending ||
                profile.isError ||
                profile.data?.deletionRequested ||
                profile.data?.deletionRequest?.status === "PENDING"
              }
              onClick={() => open("deletion")}
              className={optionClass}
            >
              <Trash2 size={21} aria-hidden="true" />
              {profile.data?.deletionRequested ||
              profile.data?.deletionRequest?.status === "PENDING"
                ? "Exclusão solicitada"
                : "Solicitar exclusão de conta"}
              <ArrowRight size={18} className="ml-auto" aria-hidden="true" />
            </button>
          )}
          <ErrorMessage error={download.error} />
        </section>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="profile-dialog-title"
        onClose={() => {
          setDeletionPassword("");
          setDeletionReason("");
        }}
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
        {!admin && active === "deletion" ? (
          deletion.isSuccess ? (
            <FeedbackModalContent
              type="success"
              titleId="profile-dialog-title"
              title="Solicitação registrada"
              message="Sua solicitação de exclusão foi registrada e ficará pendente de análise."
              actionLabel="Fechar"
              onClose={close}
            />
          ) : (
            <form
              key="deletion"
              className="space-y-5 px-6 py-10 sm:px-10"
              onSubmit={(event) => {
                event.preventDefault();
                const reason = deletionReason.trim();
                if (
                  busy ||
                  !deletionPassword ||
                  !reason ||
                  reason.length > 2000
                )
                  return;
                deletion.mutate(
                  { currentPassword: deletionPassword, reason },
                  { onSuccess: () => setDeletionPassword("") },
                );
              }}
            >
              <div className="mb-6 text-center">
                <Trash2
                  size={32}
                  aria-hidden="true"
                  className="mx-auto mb-4 text-red-700"
                />
                <h2
                  id="profile-dialog-title"
                  className="text-2xl font-semibold"
                >
                  Solicitar exclusão de conta
                </h2>
                <p className="mt-3 text-sm text-(--muted)">
                  Confirme sua senha atual e informe o motivo da exclusão. Sua
                  solicitação ficará pendente de análise.
                </p>
              </div>
              <fieldset disabled={busy} className="space-y-5">
                <Input
                  id="deletion-current-password"
                  name="currentPassword"
                  label="Senha atual"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={deletionPassword}
                  onChange={(event) => setDeletionPassword(event.target.value)}
                />
                <div>
                  <label
                    htmlFor="deletion-reason"
                    className="block text-sm font-medium text-[var(--ink)]"
                  >
                    Motivo da exclusão
                  </label>
                  <textarea
                    id="deletion-reason"
                    name="reason"
                    required
                    maxLength={2000}
                    rows={4}
                    value={deletionReason}
                    onChange={(event) => setDeletionReason(event.target.value)}
                    aria-describedby="deletion-reason-limit"
                    className={fieldClass + " resize-y"}
                  />
                  <p
                    id="deletion-reason-limit"
                    className="mt-2 text-xs text-(--muted)"
                  >
                    Até 2000 caracteres.
                  </p>
                </div>
              </fieldset>
              <ErrorMessage error={deletion.error} />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={close}
                  className="min-h-12 rounded-xl border border-(--line) text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy || !deletionPassword || !deletionReason.trim()}
                  className="min-h-12 rounded-xl bg-[#e83e32] px-4 py-3 text-sm font-medium text-white hover:bg-[#cf3026] disabled:opacity-50"
                >
                  {deletion.isPending ? "Solicitando…" : "Solicitar exclusão"}
                </button>
              </div>
            </form>
          )
        ) : (
          <form
            key="password"
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
                maxLength={72}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-describedby="password-requirements"
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar nova senha"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                aria-describedby="password-requirements"
              />
              <PasswordRequirements password={newPassword} confirmation={confirmation} />
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

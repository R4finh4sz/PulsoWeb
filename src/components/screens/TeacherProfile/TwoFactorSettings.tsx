"use client";

import {
  ErrorMessage,
  actionClass,
} from "@/components/screens/Integration/shared";
import Input from "@/components/ui/Input";
import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";
import { useMutation } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { useRef } from "react";

export function TwoFactorSettings() {
  const enabled = useAuthState((state) => state.session?.twoFactorEnabled);
  const dialog = useRef<HTMLDialogElement>(null);
  const mutation = useMutation({
    mutationFn: authApi.updateTwoFactor,
    onSuccess: (_, body) => {
      const session = useAuthState.getState().session;
      if (session)
        useAuthState
          .getState()
          .setSession({ ...session, twoFactorEnabled: body.enabled });
      dialog.current?.close();
    },
  });
  return (
    <div className="space-y-3">
      <div className="flex min-h-16 items-center gap-4 rounded-xl border border-(--line) bg-white px-5 py-3">
        <LockKeyhole size={21} aria-hidden="true" />
        <span id="two-factor-label" className="flex-1 text-sm font-medium">
          Autenticação de 2 fatores
        </span>
        <button
          type="button"
          role="switch"
          aria-labelledby="two-factor-label"
          aria-checked={enabled === true}
          disabled={enabled === undefined || mutation.isPending}
          onClick={() => {
            mutation.reset();
            dialog.current?.showModal();
          }}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-cyan-700 disabled:opacity-50"
        >
          <span
            className={`flex h-6 w-11 items-center rounded-full p-0.5 ${enabled ? "justify-end bg-cyan-700" : "justify-start bg-slate-500"}`}
          >
            <span className="h-5 w-5 rounded-full bg-white" />
          </span>
        </button>
      </div>
      {mutation.isSuccess && (
        <p role="status" className="text-sm text-cyan-800">
          Autenticação de dois fatores {enabled ? "ativada" : "desativada"}.
        </p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="two-factor-title"
        onClose={(event) => event.currentTarget.querySelector("form")?.reset()}
        onCancel={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
        className="fixed inset-0 m-auto w-[min(calc(100vw-40px),528px)] rounded-2xl bg-white p-6 backdrop:bg-black/70"
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending || enabled === undefined) return;
            const form = event.currentTarget;
            const currentPassword = String(
              new FormData(form).get("currentPassword") ?? "",
            );
            if (!currentPassword) return;
            mutation.mutate(
              { enabled: !enabled, currentPassword },
              { onSettled: () => form.reset() },
            );
          }}
        >
          <h2 id="two-factor-title" className="text-xl font-semibold">
            {enabled ? "Desativar" : "Ativar"} autenticação de dois fatores
          </h2>
          <p className="text-sm text-(--muted)">
            Digite sua senha atual para concluir a alteração.
          </p>
          <Input
            id="two-factor-password"
            name="currentPassword"
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            required
            disabled={mutation.isPending}
          />
          <ErrorMessage error={mutation.error} />
          <div className="flex gap-3">
            <button
              type="button"
              className="min-h-12 flex-1 rounded-xl border border-(--line) px-4"
              disabled={mutation.isPending}
              onClick={() => dialog.current?.close()}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={actionClass}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Salvando…" : "Concluir"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

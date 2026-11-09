"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { ErrorMessage } from "@/components/screens/Integration/shared";
import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";

export function TermsActions() {
  const admin = useAuthState((state) => state.session?.user.role === "ADMIN");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const client = useQueryClient();
  const router = useRouter();
  const revoke = useMutation({
    mutationFn: authApi.revokeTerms,
    onSuccess: async () => {
      useAuthState.getState().setSession(null);
      await client.cancelQueries();
      client.clear();
      client.setQueryData(["session"], null);
      router.replace("/");
    },
    retry: false,
  });
  function close() {
    if (revoke.isPending) return;
    dialog.current?.close();
    trigger.current?.focus();
  }
  if (admin) return <BackLink />;
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <BackLink disabled={revoke.isPending} />
        <button
          ref={trigger}
          type="button"
          disabled={revoke.isPending}
          onClick={() => {
            revoke.reset();
            dialog.current?.showModal();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-700 disabled:opacity-50"
        >
          <ShieldX size={18} aria-hidden="true" />
          Revogar
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="revoke-terms-title"
        aria-describedby="revoke-terms-warning"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-transparent p-0 backdrop:bg-black/70"
      >
        <FeedbackModalContent
          type="error"
          title="AVISO!"
          titleId="revoke-terms-title"
          message={
            <p id="revoke-terms-warning">
              Ao revogar o aceite dos termos, você perderá o acesso ao sistema.
              Para voltar a utilizar a plataforma, será necessário aceitar os
              termos novamente.
            </p>
          }
          actionLabel="Cancelar"
          autoFocusAction
          onClose={close}
          disabled={revoke.isPending}
          error={<ErrorMessage error={revoke.error} />}
          secondaryAction={{
            label: revoke.isPending ? "Revogando…" : "Sim, Revogar",
            destructive: true,
            onClick: () => {
              if (!revoke.isPending) revoke.mutate();
            },
          }}
        />
      </dialog>
    </>
  );
}

"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import Input from "@/components/ui/Input";
import { registrationApi } from "@/integrations/registration/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import type { SyntheticEvent } from "react";

function TeacherInvitationForm() {

  const mutation = useApiMutation((body: { email: string; }) => registrationApi.invite("teachers", body));
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const form = event.currentTarget;
    try {
      await mutation.mutateAsync({ email: String(new FormData(form).get("email")).trim(), });
      form.reset();

    } catch {
      // Feedback is handled by useApiMutation; preserve the form for retry.
    }
  }
  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <DashboardPanel id="invitation-data" title="Convite por e-mail" description="O destinatário receberá um link para confirmar o e-mail e preencher o cadastro. A solicitação será enviada para análise.">
        <div className="space-y-5">
          <Input id="email" name="email" label="E-mail" type="email" autoComplete="email" required maxLength={254} />

          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Enviando…" : "Enviar convite"}</Button>
          {mutation.isSuccess && <p role="status" className="text-sm text-(--blue)">Convite enviado por e-mail.</p>}
        </div>
      </DashboardPanel>
    </form>
  );
}

export default function NewTeacherPage() {
  return (
    <Protected role="coordenador">
      {(user) => <Workspace user={user} title="Convidar professor"><TeacherInvitationForm /></Workspace>}
    </Protected>
  );
}

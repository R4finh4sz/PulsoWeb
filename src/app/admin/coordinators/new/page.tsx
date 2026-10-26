"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { InvitationSchoolSelector } from "@/components/screens/Registration/InvitationSchoolSelector";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import Input from "@/components/ui/Input";
import { registrationApi } from "@/integrations/registration/api";
import { useSchools } from "@/integrations/schools/hooks";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useState, type SyntheticEvent } from "react";

function CoordinatorInvitationForm() {
  const schools = useSchools(true);
  const [schoolId, setSchoolId] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const mutation = useApiMutation((body: { email: string; schoolId: number; }) =>
    registrationApi.invite("coordinators", body),
  );
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const form = event.currentTarget;
    try {
      await mutation.mutateAsync({
        email: String(new FormData(form).get("email")).trim(),
        schoolId: Number(schoolId),
      });
      form.reset();
      setSchoolId("");
      setFormVersion((version) => version + 1);
    } catch {
      // Feedback is handled by useApiMutation; preserve the form for retry.
    }
  }
  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <DashboardPanel
        id="invitation-data"
        title="Convite por e-mail"
        description="O destinatário receberá um link para confirmar o e-mail e preencher o cadastro. A solicitação será enviada para análise."
      >
        <div className="space-y-5">
          <Input
            id="email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
          <InvitationSchoolSelector
            key={formVersion}
            schools={schools.data}
            loading={schools.isPending}
            error={schools.error}
            value={schoolId}
            onChange={setSchoolId}
          />
          <Button
            type="submit"
            disabled={mutation.isPending || !schools.data?.length}
          >
            {mutation.isPending ? "Enviando…" : "Enviar convite"}
          </Button>
          {mutation.isSuccess && (
            <p role="status" className="text-sm text-(--blue)">
              Convite enviado por e-mail.
            </p>
          )}
        </div>
      </DashboardPanel>
    </form>
  );
}

export default function NewCoordinatorPage() {
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace user={user} title="Convidar coordenador">
          <CoordinatorInvitationForm />
        </Workspace>
      )}
    </Protected>
  );
}

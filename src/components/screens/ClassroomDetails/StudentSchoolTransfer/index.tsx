"use client";

import Button from "@/components/ui/Button";
import { ErrorMessage } from "@/components/screens/Integration/shared";
import { InvitationSchoolSelector } from "@/components/screens/Registration/InvitationSchoolSelector";
import { registrationApi } from "@/integrations/registration/api";
import type { User } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useState } from "react";

export function StudentSchoolTransfer({ student, currentSchoolId }: { student: User; currentSchoolId?: number }) {
  const [schoolId, setSchoolId] = useState("");
  const transfer = useApiMutation(() => registrationApi.transferStudent({
    fullName: student.fullName,
    ra: student.ra,
    schoolId: Number(schoolId),
  }));
  const sameSchool = schoolId !== "" && Number(schoolId) === (currentSchoolId ?? student.schoolId);

  return (
    <details className="mt-6 border-t border-(--line) pt-5">
      <summary className="min-h-11 cursor-pointer text-sm font-medium text-(--blue-dark)">
        Transferir para outra escola
      </summary>
      {transfer.isSuccess ? (
        <p role="status" className="mt-4 text-sm text-(--ink)">
          Solicitação enviada. O aluno permanece nesta escola até o aceite da coordenação de destino. Seu histórico e suas notas serão preservados.
        </p>
      ) : (
        <form
          aria-label="Solicitar transferência de escola"
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!schoolId || sameSchool || transfer.isPending) return;
            transfer.mutate();
          }}
        >
          <p className="text-sm text-(--muted)">
            Escolha a escola de destino. A solicitação aparecerá na fila de aceite de alunos dessa escola.
          </p>
          <InvitationSchoolSelector value={schoolId} onChange={setSchoolId} />
          {sameSchool && <p role="alert" className="text-sm text-red-700">Escolha uma escola diferente da atual.</p>}
          <ErrorMessage error={transfer.error} />
          <Button type="submit" disabled={!schoolId || sameSchool || transfer.isPending}>
            {transfer.isPending ? "Enviando…" : "Solicitar transferência"}
          </Button>
        </form>
      )}
    </details>
  );
}

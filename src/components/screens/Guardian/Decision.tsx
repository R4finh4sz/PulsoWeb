"use client";
import Button from "@/components/ui/Button";
import { ApiError } from "@/api/client";
import { fieldClass } from "@/components/screens/Integration/shared";
import {
  guardianApi,
  guardianRelationshipLabel,
  type GuardianDecision,
  type GuardianRelationship,
} from "@/integrations/guardian/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function PublicShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-(--canvas) px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-(--line) bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export const unavailableMessage = "Este link expirou ou já foi usado.";

export function GuardianDecisionScreen({ token }: { token: string }) {
  const [relationship, setRelationship] = useState<GuardianRelationship | "">("");
  const [declaration, setDeclaration] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const invitation = useQuery({
    queryKey: ["guardian-invitation", token],
    queryFn: ({ signal }) => guardianApi.invitation(token, signal),
    retry: false,
  });
  const decide = useMutation({
    mutationFn: (decision: GuardianDecision) =>
      guardianApi.decide(
        token,
        decision === "CONFIRM"
          ? {
              decision,
              relationship: relationship as GuardianRelationship,
              declaration: true,
              termsVersion: invitation.data!.terms.version, privacyAccepted: true, privacyVersion: invitation.data!.privacy.version,
            }
          : { decision },
      ),
  });

  if (invitation.isPending)
    return <PublicShell title="Confirmação do responsável"><p role="status">Carregando…</p></PublicShell>;
  if (invitation.isError)
    return (
      <PublicShell title="Confirmação do responsável">
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {unavailableMessage}
        </p>
      </PublicShell>
    );
  if (decide.isSuccess) {
    const decision = decide.data.decision;
    return (
      <PublicShell title="Obrigado!">
        <p role="status">
          {decision === "CONFIRM"
            ? "Sua confirmação foi registrada. A escola dará continuidade ao cadastro do aluno."
            : decision === "DECLINE"
              ? "Sua recusa foi registrada. O cadastro do aluno não será concluído."
              : "Registramos que você não reconhece este pedido. A escola irá analisar o caso."}
        </p>
      </PublicShell>
    );
  }
  const { studentName, schoolName, purpose, terms, privacy, relationships } = invitation.data;
  const expired = decide.error instanceof ApiError;
  return (
    <PublicShell title="Confirmação do responsável legal">
      <p className="text-sm">
        A escola <strong>{schoolName}</strong> pede a sua confirmação para o cadastro de{" "}
        <strong>{studentName}</strong> na plataforma Pulso Escolar.
      </p>
      {purpose && <p className="text-sm text-(--muted)">{purpose}</p>}
      <section aria-labelledby="guardian-privacy"><h2 id="guardian-privacy" className="text-base font-semibold">{privacy.title} · {privacy.version}</h2><div tabIndex={0} className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-6">{privacy.content}</div></section><section aria-labelledby="guardian-terms">
        <h2 id="guardian-terms" className="text-base font-semibold">{terms.title}</h2>
        <div
          tabIndex={0}
          className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-(--line) p-4 text-sm"
        >
          {terms.content}
        </div>
      </section>
      <label className="block text-sm font-medium">
        Seu parentesco com o aluno
        <select
          value={relationship}
          onChange={(event) => setRelationship(event.target.value as GuardianRelationship)}
          className={fieldClass}
        >
          <option value="">Selecione</option>
          {relationships.map((value) => (
            <option key={value} value={value}>{guardianRelationshipLabel(value)}</option>
          ))}
        </select>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={declaration}
          onChange={(event) => setDeclaration(event.target.checked)}
          className="mt-1 h-5 w-5"
        />
        Declaro que sou o responsável legal de {studentName} e li o termo do responsável e aceito a política de privacidade acima.
      </label>
      {localError && <p role="alert" className="text-sm text-red-700">{localError}</p>}
      {decide.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {expired && [400, 404, 409, 410].includes((decide.error as ApiError).status)
            ? unavailableMessage
            : decide.error.message}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          disabled={decide.isPending}
          onClick={() => {
            setLocalError(null);
            if (!relationship) return setLocalError("Selecione o seu parentesco com o aluno.");
            if (!declaration) return setLocalError("Marque a declaração para confirmar.");
            decide.mutate("CONFIRM");
          }}
        >
          Confirmar
        </Button>
        <Button variant="danger" disabled={decide.isPending} onClick={() => decide.mutate("DECLINE")}>
          Recusar
        </Button>
        <Button variant="danger" disabled={decide.isPending} onClick={() => decide.mutate("NOT_RECOGNIZED")}>
          Não reconheço
        </Button>
      </div>
    </PublicShell>
  );
}

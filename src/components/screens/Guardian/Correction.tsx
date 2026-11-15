"use client";
import Button from "@/components/ui/Button";
import { fieldClass } from "@/components/screens/Integration/shared";
import { PublicShell, unavailableMessage } from "@/components/screens/Guardian/Decision";
import { guardianApi } from "@/integrations/guardian/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type SyntheticEvent } from "react";

export function GuardianCorrectionScreen({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const view = useQuery({
    queryKey: ["guardian-correction", token],
    queryFn: ({ signal }) => guardianApi.correctionView(token, signal),
    retry: false,
  });
  const correct = useMutation({
    mutationFn: () => guardianApi.correct(token, { name: name.trim(), email: email.trim() }),
  });
  const title = "Corrigir contato do responsável";
  if (view.isPending) return <PublicShell title={title}><p role="status">Carregando…</p></PublicShell>;
  if (view.isError)
    return (
      <PublicShell title={title}>
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{unavailableMessage}</p>
      </PublicShell>
    );
  if (correct.isSuccess)
    return (
      <PublicShell title="Contato corrigido">
        <p role="status">
          Recebemos os novos dados. O processo voltou para a conferência da escola; depois dela, o
          responsável receberá o convite por e-mail.
        </p>
      </PublicShell>
    );
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (name.trim() && email.trim()) correct.mutate();
  };
  return (
    <PublicShell title={title}>
      <p className="text-sm">
        A escola <strong>{view.data.schoolName}</strong> pediu uma correção no contato do responsável
        de <strong>{view.data.studentName}</strong>.
      </p>
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Motivo informado pela escola</p>
        <p className="mt-1 whitespace-pre-wrap">{view.data.reason}</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">
          Nome completo do responsável
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          E-mail do responsável
          <input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        </label>
        <p className="text-xs text-(--muted)">
          Depois de corrigir, o processo volta para a conferência da escola antes de o convite ser enviado.
        </p>
        {correct.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{correct.error.message}</p>
        )}
        <Button type="submit" disabled={correct.isPending}>
          {correct.isPending ? "Enviando…" : "Enviar correção"}
        </Button>
      </form>
    </PublicShell>
  );
}

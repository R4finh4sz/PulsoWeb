"use client";
import {
  EmptyState,
  ErrorMessage,
  fieldClass,
} from "@/components/screens/Integration/shared";
import Button from "@/components/ui/Button";
import { useAuthState } from "@/integrations/auth/state";
import {
  guardianApi,
  guardianStatusLabel,
  guardianStatusLabels,
  MAX_GUARDIAN_RESENDS,
  type GuardianConfirmation,
  type GuardianStatus,
} from "@/integrations/guardian/api";
import { registrationApi } from "@/integrations/registration/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { useState } from "react";

export const guardianKey = ["guardian-confirmations"];
const formatDate = (value: string | null | undefined) =>
  value ? value.slice(0, 10).split("-").reverse().join("/") : "—";
const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export function useGuardianByRegistration(enabled: boolean) {
  return useQuery({
    queryKey: [...guardianKey, "by-registration"],
    enabled,
    queryFn: async ({ signal }) => {
      const statuses = Object.keys(guardianStatusLabels) as GuardianStatus[];
      const pages = await Promise.all(
        statuses.map((status) => guardianApi.list(status, 0, signal, 100)),
      );
      const map = new Map<number, GuardianConfirmation>();
      for (const item of pages.flatMap((page) => page.content))
        map.set(item.registrationId, item);
      return map;
    },
  });
}

export function GuardianBadge({ status }: { status: string }) {
  const tone =
    status === "CONFIRMED"
      ? "bg-green-50 text-green-800"
      : status === "EXPIRED" || status === "DECLINED"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-800";
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${tone}`}
    >
      Responsável: {guardianStatusLabel(status)}
    </span>
  );
}

export function BirthDateForm({
  id,
  current,
  onDone,
}: {
  id: number;
  current: string | null;
  onDone: () => void;
}) {
  const client = useQueryClient();
  const [birthDate, setBirthDate] = useState(current ?? "");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const save = useApiMutation(async () => {
    const born = new Date(birthDate + "T00:00:00");
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() - 15);
    if (Number.isNaN(born.getTime()) || born > limit)
      throw new Error("O aluno precisa ter pelo menos 15 anos.");
    await registrationApi.correctBirthDate(id, {
      birthDate,
      reason: reason.trim(),
    });
    await Promise.all([
      client.invalidateQueries({ queryKey: ["registration-requests"] }),
      client.invalidateQueries({ queryKey: guardianKey }),
    ]);
  }, onDone);
  return (
    <form
      className="w-full space-y-3 rounded-xl bg-slate-50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setLocalError(null);
        if (!birthDate || !reason.trim()) {
          setLocalError("Informe a nova data e o motivo da correção.");
          return;
        }
        save.mutate();
      }}
    >
      <label className="block text-sm font-medium">
        Data de nascimento correta
        <input
          type="date"
          value={birthDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) => setBirthDate(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Motivo da correção
        <textarea
          value={reason}
          maxLength={2000}
          onChange={(event) => setReason(event.target.value)}
          className={fieldClass}
        />
      </label>
      <p className="text-xs text-(--muted)">
        Se o aluno passar a ser menor de idade, o processo do responsável será
        aberto e o aluno receberá um e-mail pedindo o contato do responsável.
      </p>
      {localError && (
        <p role="alert" className="text-sm text-red-700">
          {localError}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar data"}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onDone}
          disabled={save.isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ConfirmationRow({ item }: { item: GuardianConfirmation }) {
  const client = useQueryClient();
  const isAdmin = useAuthState((state) => state.session?.user.role) === "ADMIN";
  const [mode, setMode] = useState<"verify" | "correct" | null>(null);
  const [method, setMethod] = useState("Registro escolar");
  const [justification, setJustification] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: guardianKey });
  const verify = useApiMutation(
    async () => {
      await guardianApi.verify(item.id, {
        method: method.trim(),
        ...(justification.trim()
          ? { justification: justification.trim() }
          : {}),
      });
      await refresh();
    },
    () => setMode(null),
  );
  const correct = useApiMutation(
    async () => {
      await guardianApi.requestCorrection(item.id, reason.trim());
      await refresh();
    },
    () => setMode(null),
  );
  const resend = useApiMutation(async () => {
    await guardianApi.resend(item.id);
    await refresh();
  });
  const busy = verify.isPending || correct.isPending || resend.isPending;
  const canResend =
    item.status === "AWAITING_GUARDIAN" || item.status === "EXPIRED";
  const resendBlocked = item.resendCount >= MAX_GUARDIAN_RESENDS;
  return (
    <li className="space-y-3 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold">
            {item.studentName}
          </h3>
          <p className="text-sm text-(--muted)">
            RA {item.studentRa} · Nascimento {formatDate(item.studentBirthDate)}{" "}
            · {item.schoolName}
          </p>
          <p className="mt-1 break-all text-sm">
            Responsável informado: {item.guardianName} ({item.guardianEmail})
          </p>
          {item.correctionReason && (
            <p className="mt-1 text-sm text-(--muted)">
              Correção pedida: {item.correctionReason}
            </p>
          )}
          {item.checkedAt && (
            <p className="mt-1 text-xs text-(--muted)">
              Conferido em {formatDateTime(item.checkedAt)}
              {item.checkMethod ? ` · ${item.checkMethod}` : ""}
            </p>
          )}
          {item.invitationExpiresAt && (
            <p className="mt-1 text-xs text-(--muted)">
              Convite válido até {formatDateTime(item.invitationExpiresAt)} ·
              reenvios {item.resendCount}/{MAX_GUARDIAN_RESENDS}
            </p>
          )}
        </div>
        <GuardianBadge status={item.status} />
      </div>
      {item.status === "AWAITING_SCHOOL_CHECK" && !mode && (
        <div className="flex flex-wrap gap-3">
          <Button className="sm:w-auto" onClick={() => setMode("verify")}>
            Contato confere
          </Button>
          <Button
            className="sm:w-auto"
            variant="danger"
            onClick={() => setMode("correct")}
          >
            Contato diverge
          </Button>
        </div>
      )}
      {mode === "verify" && (
        <form
          className="space-y-3 rounded-xl bg-slate-50 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setLocalError(null);
            if (!method.trim())
              return setLocalError("Informe como o contato foi conferido.");
            if (isAdmin && !justification.trim())
              return setLocalError("Como suporte, preencha a justificativa.");
            verify.mutate();
          }}
        >
          <label className="block text-sm font-medium">
            Como o contato foi conferido
            <input
              value={method}
              maxLength={200}
              onChange={(e) => setMethod(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Justificativa{isAdmin ? " (obrigatória)" : " (opcional)"}
            <textarea
              value={justification}
              maxLength={2000}
              onChange={(e) => setJustification(e.target.value)}
              className={fieldClass}
            />
          </label>
          {localError && (
            <p role="alert" className="text-sm text-red-700">
              {localError}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {verify.isPending ? "Enviando…" : "Enviar convite"}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={() => setMode(null)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
      {mode === "correct" && (
        <form
          className="space-y-3 rounded-xl bg-slate-50 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setLocalError(null);
            if (!reason.trim())
              return setLocalError("Explique o que o aluno deve corrigir.");
            correct.mutate();
          }}
        >
          <label className="block text-sm font-medium">
            O que está divergente
            <textarea
              value={reason}
              maxLength={2000}
              onChange={(e) => setReason(e.target.value)}
              className={fieldClass}
            />
          </label>
          {localError && (
            <p role="alert" className="text-sm text-red-700">
              {localError}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {correct.isPending ? "Enviando…" : "Pedir correção ao aluno"}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={() => setMode(null)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
      {canResend && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="sm:w-auto"
            disabled={busy || resendBlocked}
            onClick={() => resend.mutate()}
          >
            {resend.isPending ? "Reenviando…" : "Reenviar convite"}
          </Button>
          {resendBlocked && (
            <span className="text-sm text-(--muted)">
              Limite de {MAX_GUARDIAN_RESENDS} reenvios atingido.
            </span>
          )}
        </div>
      )}
    </li>
  );
}

export function GuardianQueue() {
  const [status, setStatus] = useState<GuardianStatus>("AWAITING_SCHOOL_CHECK");
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: [...guardianKey, "queue", status, page],
    queryFn: ({ signal }) => guardianApi.list(status, page, signal),
  });
  return (
    <section
      aria-label="Confirmações de responsável"
      className="rounded-2xl border border-(--line) bg-white p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <UserCheck
            size={23}
            aria-hidden="true"
            className="shrink-0 text-(--blue-dark)"
          />
          Confirmações de responsável
        </h2>
        <select
          aria-label="Situação da confirmação"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as GuardianStatus);
            setPage(0);
          }}
          className="min-h-11 rounded-lg border border-(--line) bg-white px-3 text-sm"
        >
          {Object.entries(guardianStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <ErrorMessage error={query.error} />
      {query.isError && (
        <Button onClick={() => query.refetch()}>Tentar novamente</Button>
      )}
      {query.isPending && (
        <p role="status" className="py-6 text-sm text-(--muted)">
          Carregando confirmações…
        </p>
      )}
      {query.isSuccess && !query.data.content.length && (
        <EmptyState
          icon={UserCheck}
          title="Nenhuma confirmação nesta situação."
        />
      )}
      {query.isSuccess && (
        <ul className="divide-y divide-(--line)">
          {query.data.content.map((item) => (
            <ConfirmationRow key={item.id} item={item} />
          ))}
        </ul>
      )}
      {query.data && query.data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-(--line) pt-5">
          <Button
            className="sm:w-auto"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span role="status" className="text-sm text-(--muted)">
            Página {page + 1} de {query.data.totalPages}
          </span>
          <Button
            className="sm:w-auto"
            disabled={page + 1 >= query.data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </section>
  );
}

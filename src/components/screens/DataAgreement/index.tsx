"use client";
import { ApiError } from "@/api/client";
import Button from "@/components/ui/Button";
import { agreementApi } from "@/integrations/agreement/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const agreementQueryKey = ["school-data-agreement"];
export const agreementRoute = "/coordinator/data-agreement";

export function useAgreement(enabled = true) {
  return useQuery({
    queryKey: agreementQueryKey,
    enabled,
    queryFn: ({ signal }) => agreementApi.current(signal),
    retry: false,
  });
}

export function AgreementRequiredModal() {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-required-title"
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <ShieldAlert
          size={40}
          aria-hidden="true"
          className="mx-auto text-amber-600"
        />
        <h2 id="agreement-required-title" className="text-lg font-semibold">
          Termo de adesão pendente
        </h2>
        <p className="text-sm text-(--muted)">
          Há um termo de adesão institucional e tratamento de dados aguardando aceite. Você só
          poderá usar a plataforma depois de assiná-lo.
        </p>
        <Button autoFocus onClick={() => router.push(agreementRoute)}>
          Ir ver termo
        </Button>
      </div>
    </div>
  );
}

export function DataAgreementScreen() {
  const client = useQueryClient();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const agreement = useAgreement();
  const pending = agreement.data ? !agreement.data.accepted : false;
  useEffect(() => {
    if (!pending) return;
    history.pushState(null, "", location.href);
    const trap = () => history.pushState(null, "", location.href);
    window.addEventListener("popstate", trap);
    return () => window.removeEventListener("popstate", trap);
  }, [pending]);
  const accept = useMutation({
    mutationFn: (version: number) => agreementApi.accept(version),
    onSuccess: (data) => {
      client.setQueryData(agreementQueryKey, data);
      router.replace("/coordinator");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setChecked(false);
        client.invalidateQueries({ queryKey: agreementQueryKey });
      }
    },
  });
  if (agreement.isPending) return <p role="status">Carregando termo de adesão…</p>;
  if (agreement.isError)
    return (
      <Button onClick={() => agreement.refetch()}>Tentar novamente</Button>
    );
  const { version, title, content, accepted, acceptedAt } = agreement.data;
  if (accepted)
    return (
      <div className="space-y-5">
        <Link
          href="/coordinator"
          className="inline-flex items-center gap-2 text-sm font-medium text-(--blue-dark) hover:underline"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Voltar
        </Link>
      <section className="space-y-5 rounded-2xl border border-(--line) bg-white p-5 sm:p-8">
        <div>
          <h2 className="wrap-break-word text-xl font-semibold">
            {title || "Termo de adesão institucional e tratamento de dados"}
          </h2>
          <p role="status" className="mt-2 flex items-center gap-2 text-sm text-green-800">
            <ShieldCheck size={18} aria-hidden="true" className="shrink-0" />
            Termo aceito
            {acceptedAt ? ` em ${new Date(acceptedAt).toLocaleString("pt-BR")}` : ""} · versão {version}
          </p>
        </div>
        <div
          tabIndex={0}
          aria-label="Texto do termo de adesão"
          className="whitespace-pre-wrap wrap-break-word border-t border-(--line) pt-5 text-sm leading-7"
        >
          {content}
        </div>
      </section>
      </div>
    );
  return (
    <section
      aria-labelledby="data-agreement-title"
      className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6"
    >
      <h2
        id="data-agreement-title"
        className="flex items-center gap-3 text-lg font-semibold text-amber-900"
      >
        <ShieldAlert size={22} aria-hidden="true" className="shrink-0" />
        {title || "Termo de adesão institucional e tratamento de dados"}
      </h2>
      <p className="mt-2 text-sm text-amber-900">
        Leia e aceite o termo para liberar o acesso à plataforma.
      </p>
      <div
        tabIndex={0}
        aria-label="Texto do termo de adesão"
        className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-amber-200 bg-white p-4 text-sm"
      >
        {content}
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="mt-1 h-5 w-5"
        />
        Li e aceito
      </label>
      {accept.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {accept.error.message}
        </p>
      )}
      <div className="mt-4 sm:max-w-xs">
        <Button
          disabled={!checked || accept.isPending}
          onClick={() => accept.mutate(version)}
        >
          {accept.isPending ? "Aceitando…" : "Aceitar termo"}
        </Button>
      </div>
    </section>
  );
}

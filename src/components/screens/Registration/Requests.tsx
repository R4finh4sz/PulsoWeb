"use client";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { registrationApi, type RegistrationStatus } from "@/integrations/registration/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import type { UserRole } from "@/interfaces/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";
import { EmptyState, ErrorMessage, Protected, Workspace } from "../Integration/shared";

const statusLabels = { PENDING: "Pendentes", APPROVED: "Aprovados", REJECTED: "Recusados" };
const roleLabels = { STUDENT: "Aluno", TEACHER: "Professor", PEDAGOGICAL_COORDINATOR: "Coordenador", ADMIN: "Administrador" };
function RegistrationPhoto({ id }: { id: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const controller = new AbortController(); let objectUrl: string | undefined;
    registrationApi.photo(id, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(failure => { if (!controller.signal.aborted) setError(failure); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  return <><ErrorMessage error={error} />{url && <Image unoptimized src={url} width={115} height={115} alt="Foto enviada no cadastro" className="h-[7.2rem] w-[7.2rem] rounded-xl object-cover" />}</>;
}
export function RegistrationRequests({ role }: { role: UserRole }) {
  return <Protected role={role}>{user => <Workspace user={user} title="Solicitações de cadastro"><Requests /></Workspace>}</Protected>;
}
function Requests() {
  const [status, setStatus] = useState<RegistrationStatus>("PENDING");
  const [page, setPage] = useState(0);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["registration-requests", status, page], queryFn: ({ signal }) => registrationApi.list(status, page, signal) });
  const review = useApiMutation(async ({ id, decision }: { id: number; decision: RegistrationStatus }) => {
    await registrationApi.review(id, decision, "");
    await client.invalidateQueries({ queryKey: ["registration-requests"] });
  });
  return <div className="space-y-6">
    <div className="max-w-xs"><Select id="registrationStatus" label="Situação" value={status} onChange={event => { setStatus(event.target.value as RegistrationStatus); setPage(0); }}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
    {query.isPending && <p role="status">Carregando solicitações…</p>}<ErrorMessage error={query.error} />
    {query.isError && <Button onClick={() => query.refetch()}>Tentar novamente</Button>}
    {query.data && !query.data.content.length && <EmptyState />}
    {status === "APPROVED" ? <section className="overflow-hidden rounded-xl border border-(--line) bg-white"><div className="border-b border-(--line) px-4 py-3"><h2 className="text-lg font-semibold">Cadastros aprovados</h2></div><ul className="divide-y divide-[var(--line)]">{query.data?.content.map(request => <li key={request.id} className="flex flex-wrap items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--paper)] sm:flex-nowrap">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1f5f8] text-xs font-semibold text-(--blue)">{request.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toLocaleUpperCase("pt-BR")}</span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-[var(--ink)]">{request.name}</h3><p className="break-all text-xs text-(--muted)">{request.email} · RA: {request.ra || "Não informado"}</p></div><span className="ml-12 rounded-full bg-[#e1f5f8] px-2.5 py-1 text-[10px] font-medium text-(--blue) sm:ml-0">{roleLabels[request.role]}</span><span className="text-xs text-(--muted)">{request.schoolName}</span>
    </li>)}</ul></section> : <div className="grid gap-5 xl:grid-cols-2">{query.data?.content.map(request => <article key={request.id} className="space-y-3 rounded-2xl border border-(--line) bg-white p-6">
      <h2 className="wrap-break-word text-lg font-semibold">{request.name}</h2><p className="text-sm text-(--muted)">{roleLabels[request.role]} · {request.schoolName}</p>
      {request.hasPhoto && <RegistrationPhoto id={request.id} />}
      <p className="break-all text-sm">{request.email}</p><p className="text-sm">RA: {request.ra}</p>{request.birthDate && <p className="text-sm">Nascimento: {request.birthDate.split("-").reverse().join("/")}</p>}
      {request.reviewReason && <p className="whitespace-pre-wrap text-sm">Parecer: {request.reviewReason}</p>}
      {status === "PENDING" && <div className="flex gap-3"><Button disabled={review.isPending} onClick={() => review.mutate({ id: request.id, decision: "APPROVED" })}>Aprovar</Button><Button disabled={review.isPending} className="bg-red-700" onClick={() => review.mutate({ id: request.id, decision: "REJECTED" })}>Recusar</Button></div>}
    </article>)}</div>}
    {query.data && query.data.totalPages > 1 && <div className="flex items-center gap-4"><Button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button><span className="shrink-0 text-sm">Página {page + 1} de {query.data.totalPages}</span><Button disabled={page + 1 >= query.data.totalPages} onClick={() => setPage(page + 1)}>Próxima</Button></div>}
  </div>;
}

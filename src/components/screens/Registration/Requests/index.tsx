"use client";
import Button from "@/components/ui/Button";
import { classroomsApi } from "@/integrations/classrooms/api";
import Select from "@/components/ui/Select";
import {
  registrationApi,
  type RegistrationStatus,
} from "@/integrations/registration/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import { normalizeText } from "@/utils/text";
import { classroomLabel } from "@/utils/classroomLabel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Search, Trash2, UserCheck, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorMessage
} from "@/components/screens/Integration/shared";
import { AccountDeletions } from "@/components/screens/Registration/AccountDeletions";
import {
  BirthDateForm,
  GuardianBadge,
  GuardianQueue,
  guardianKey,
  useGuardianByRegistration,
} from "@/components/screens/Registration/Guardian";
import { agreementQueryKey } from "@/components/screens/DataAgreement";
import { ApiError } from "@/api/client";

const statusLabels = {
  PENDING: "Pendentes",
  APPROVED: "Aprovados",
  REJECTED: "Recusados",
};
const roleLabels = {
  STUDENT: "Aluno",
  TEACHER: "Professor",
  PEDAGOGICAL_COORDINATOR: "Coordenador",
  ADMIN: "Administrador",
};
function RegistrationPhoto({ id, type = "REGISTRATION" }: { id: number; type?: "REGISTRATION" | "TRANSFER" }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    registrationApi
      .photo(id, controller.signal, type)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, type]);
  return (
    <>
      <ErrorMessage error={error} />
      {url && (
        <Image
          unoptimized
          src={url}
          width={115}
          height={115}
          alt="Foto enviada no cadastro"
          className="h-[7.2rem] w-[7.2rem] rounded-xl object-cover"
        />
      )}
    </>
  );
}

export function CoordinatorRequests({
  initialType,
}: {
  initialType: "TEACHER" | "STUDENT" | "DELETION" | "GUARDIAN";
}) {
  const [kind, setKind] = useState<"TEACHER" | "STUDENT" | "DELETION" | "GUARDIAN">(
    initialType,
  );
  const [status, setStatus] = useState<RegistrationStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const client = useQueryClient();
  const [selectedClassrooms, setSelectedClassrooms] = useState<Record<string, string>>({});
  const [requestType, setRequestType] = useState<"ALL" | "REGISTRATION" | "TRANSFER">("ALL");
  const [identityChecked, setIdentityChecked] = useState<Record<number, boolean>>({});
  const [editingBirthDate, setEditingBirthDate] = useState<number | null>(null);
  const guardians = useGuardianByRegistration(kind === "STUDENT");
  const query = useQuery({
    queryKey: ["registration-requests", "coordinator", status],
    enabled: kind === "TEACHER" || kind === "STUDENT",
    queryFn: async ({ signal }) => {
      const first = await registrationApi.list(status, 0, signal);
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
          registrationApi.list(status, index + 1, signal),
        ),
      );
      return [first, ...rest].flatMap((result) => result.content);
    },
  });
  const rooms = useQuery({
    queryKey: ["classrooms", "transfer-requests"],
    queryFn: ({ signal }) => classroomsApi.list(signal),
    enabled: kind === "STUDENT" && status === "PENDING" && (query.data ?? []).some((request) => request.type === "TRANSFER"),
  });
  const review = useApiMutation(
    async ({
      id,
      decision,
      type,
      classroomId,
      identityChecked,
    }: {
      id: number;
      decision: "APPROVED" | "REJECTED";
      type?: "REGISTRATION" | "TRANSFER";
      classroomId?: number;
      identityChecked?: boolean;
    }) => {
      try {
        if (type === "TRANSFER") {
          if (decision === "APPROVED" && !rooms.data?.some((room) => room.id === classroomId))
            throw new Error("Selecione uma turma de destino válida.");
          await registrationApi.review(id, decision, "", {
            type,
            ...(decision === "APPROVED" ? { classroomId } : {}),
          });
        } else if (identityChecked !== undefined) {
          await registrationApi.review(id, decision, "", {
            type: "REGISTRATION",
            ...(decision === "APPROVED" ? { identityChecked } : {}),
          });
        } else {
          await registrationApi.review(id, decision, "");
        }
      } catch (failure) {
        if (failure instanceof ApiError && failure.status === 409 && /contrato|termo de adesão/i.test(failure.message))
          await client.invalidateQueries({ queryKey: agreementQueryKey });
        throw failure;
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: ["registration-requests"] }),
        client.invalidateQueries({ queryKey: ["users"] }),
        client.invalidateQueries({ queryKey: guardianKey }),
        client.invalidateQueries({ queryKey: ["classrooms"] }),
      ]);
    },
  );
  const filtered = (query.data ?? []).filter(
    (request) =>
      request.role === kind &&
      (kind !== "STUDENT" || requestType === "ALL" || (request.type ?? "REGISTRATION") === requestType) &&
      normalizeText(
        `${request.name} ${request.email} ${request.ra} ${request.schoolName}`,
      ).includes(normalizeText(search.trim())),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages - 1);

  return (
    <div className="space-y-6">
      <nav
        aria-label="Tipo de solicitação"
        className="flex gap-2 overflow-x-auto border-b border-(--line)"
      >
        {(
          [
            { value: "TEACHER", label: "Professores", icon: Users },
            { value: "STUDENT", label: "Alunos", icon: GraduationCap },
            { value: "GUARDIAN", label: "Responsáveis", icon: UserCheck },
            { value: "DELETION", label: "Exclusões de conta", icon: Trash2 },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            onClick={() => {
              setKind(value);
              setSearch("");
              setPage(0);
            }}
            className={`flex min-h-14 items-center gap-3 rounded-t-xl border-b-2 px-5 text-sm font-medium sm:px-7 ${kind === value ? "border-(--blue) bg-cyan-50 text-(--blue-dark)" : "border-transparent text-(--muted) hover:bg-white"}`}
          >
            <Icon size={22} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      {kind === "DELETION" ? (
        <AccountDeletions />
      ) : kind === "GUARDIAN" ? (
        <GuardianQueue />
      ) : (
        <section
          aria-label={`Solicitações de ${kind === "TEACHER" ? "professores" : "alunos"}`}
          className="rounded-2xl border border-(--line) bg-white p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <Users
                size={23}
                aria-hidden="true"
                className="shrink-0 text-(--blue-dark)"
              />
              Solicitações de {kind === "TEACHER" ? "professores" : "alunos"}
            </h2>
            <select
              aria-label="Situação das solicitações"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as RegistrationStatus);
                setPage(0);
              }}
              className="min-h-11 rounded-lg border border-(--line) bg-white px-3 text-sm"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {kind === "STUDENT" && (
            <label className="mb-4 block text-sm">Tipo de pedido
              <select aria-label="Filtrar por tipo de pedido" value={requestType} onChange={(event) => {
                setRequestType(event.target.value as typeof requestType);
                setPage(0);
              }} className="ml-3 min-h-11 rounded-lg border border-(--line) bg-white px-3 text-sm">
                <option value="ALL">Cadastros e transferências</option>
                <option value="REGISTRATION">Cadastros</option>
                <option value="TRANSFER">Transferências</option>
              </select>
            </label>
          )}
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-(--line) px-4 focus-within:ring-2 focus-within:ring-(--focus)">
            <Search
              size={19}
              aria-hidden="true"
              className="shrink-0 text-(--muted)"
            />
            <input
              type="search"
              aria-label="Buscar solicitação"
              placeholder="Buscar solicitação"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              className="min-w-0 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <div className="mt-4">
            <ErrorMessage error={review.error || query.error || (kind === "STUDENT" ? rooms.error : null)} />
            {review.error instanceof ApiError && review.error.status === 409 && /contrato|termo de adesão/i.test(review.error.message) && (
              <Link href="/coordinator/data-agreement" className="mt-2 inline-block text-sm font-medium text-(--blue-dark) underline">
                Ir para o termo de adesão
              </Link>
            )}
            {kind === "STUDENT" && rooms.isError && <Button onClick={() => rooms.refetch()}>Carregar turmas novamente</Button>}
          </div>
          {query.isPending && (
            <p role="status" className="py-6 text-sm text-(--muted)">
              Carregando solicitações…
            </p>
          )}
          {query.isError && (
            <Button onClick={() => query.refetch()}>Tentar novamente</Button>
          )}
          {query.isSuccess && !filtered.length && (
            <EmptyState
              icon={Users}
              title={
                search
                  ? "Nenhuma solicitação encontrada para esta busca."
                  : "Nenhuma solicitação nesta categoria."
              }
            />
          )}
          {query.isSuccess && (
            <ul className="space-y-4">
              {filtered
                .slice(current * 10, current * 10 + 10)
                .map((request) => (
                  <li
                    key={`${request.type ?? "REGISTRATION"}:${request.id}`}
                    className="rounded-xl border border-(--line) bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-(--blue-dark)"
                      >
                        {request.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-base font-semibold">
                          {request.name}
                        </h3>
                        <p className="mt-0.5 break-all text-sm text-(--muted)">
                          {request.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-(--blue-dark)">
                          {request.type === "TRANSFER" ? "Transferência de escola · Histórico preservado" : "Cadastro"}
                        </span>
                        {kind === "STUDENT" && request.type !== "TRANSFER" && guardians.data?.get(request.id) && (
                          <GuardianBadge status={guardians.data.get(request.id)!.status} />
                        )}
                      </div>
                    </div>
                    {kind === "STUDENT" && request.type !== "TRANSFER" && (
                      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:ml-16 sm:max-w-md">
                        <div>
                          <dt className="text-xs text-(--muted)">RA</dt>
                          <dd className="font-medium">{request.ra || "não informado"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-(--muted)">Nascimento</dt>
                          <dd className="font-medium">
                            {request.birthDate ? request.birthDate.split("-").reverse().join("/") : "não informado"}
                          </dd>
                        </div>
                      </dl>
                    )}
                    {request.hasPhoto && (
                      <div className="mt-4 sm:ml-16">
                        <RegistrationPhoto id={request.id} type={request.type} />
                      </div>
                    )}
                    {status === "PENDING" && kind === "STUDENT" && request.type !== "TRANSFER" && (
                      <div className="mt-4 space-y-3 sm:ml-16">
                        <label className="flex items-center gap-3 text-sm leading-5">
                          <input
                            type="checkbox"
                            checked={!!identityChecked[request.id]}
                            onChange={(event) =>
                              setIdentityChecked((current) => ({ ...current, [request.id]: event.target.checked }))
                            }
                            className="h-5 w-5 shrink-0"
                          />
                          Conferi nome, RA e data de nascimento com os registros da escola
                        </label>
                        {editingBirthDate === request.id ? (
                          <BirthDateForm
                            id={request.id}
                            current={request.birthDate}
                            onDone={() => setEditingBirthDate(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingBirthDate(request.id)}
                            className="text-sm font-medium text-(--blue-dark) underline"
                          >
                            Corrigir data de nascimento
                          </button>
                        )}
                      </div>
                    )}
                    {status === "PENDING" && request.type === "TRANSFER" && (
                      <div className="mt-4 w-full sm:ml-16 sm:w-64">
                        <Select
                          id={"transfer-classroom-" + request.id}
                          label={"Turma de destino de " + request.name}
                          value={selectedClassrooms["TRANSFER:" + request.id] ?? ""}
                          disabled={rooms.isPending || rooms.isError || review.isPending}
                          onChange={(event) => setSelectedClassrooms((current) => ({ ...current, ["TRANSFER:" + request.id]: event.target.value }))}
                        >
                          <option value="">Selecione uma turma</option>
                          {(rooms.data ?? []).map((room) => <option key={room.id} value={room.id}>{classroomLabel(room)}</option>)}
                        </Select>
                        {rooms.isPending && <p role="status" className="mt-2 text-sm text-(--muted)">Carregando turmas…</p>}
                        {rooms.isSuccess && !rooms.data.length && <p className="mt-2 text-sm text-(--muted)">Cadastre uma turma de destino para aprovar a transferência.</p>}
                      </div>
                    )}
                    {status === "PENDING" && kind === "STUDENT" && request.type !== "TRANSFER" && guardians.data?.get(request.id)?.status === "AWAITING_SCHOOL_CHECK" ? (
                      <div className="mt-5 flex w-full justify-center border-t border-(--line) pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setKind("GUARDIAN");
                            setSearch("");
                            setPage(0);
                          }}
                          className="min-h-11 w-full max-w-60 rounded-lg bg-(--blue-dark) px-5 text-sm font-medium text-white hover:bg-[#076a83]"
                        >
                          Conferir
                        </button>
                      </div>
                    ) : status === "PENDING" ? (
                      <div className="mt-5 flex w-full gap-3 border-t border-(--line) pt-4 sm:justify-end">
                        <button
                          type="button"
                          disabled={review.isPending}
                          aria-label={`Recusar ${request.type === "TRANSFER" ? "transferência" : "cadastro"} de ${request.name}`}
                          onClick={() => {
                            review.mutate({
                              id: request.id,
                              decision: "REJECTED",
                              type: request.type,
                            });
                          }}
                          className="min-h-11 flex-1 rounded-lg bg-[#e83e32] px-5 text-sm font-medium text-white hover:bg-[#cf3026] disabled:opacity-50 sm:min-w-28"
                        >
                          {review.isPending &&
                            review.variables?.id === request.id &&
                            review.variables.type === request.type &&
                            review.variables.decision === "REJECTED"
                            ? "Recusando…"
                            : "Recusar"}
                        </button>
                        <button
                          type="button"
                          disabled={review.isPending || (request.type === "TRANSFER" && (rooms.isPending || rooms.isError || !selectedClassrooms[`TRANSFER:${request.id}`])) || (kind === "STUDENT" && request.type !== "TRANSFER" && !identityChecked[request.id])}
                          aria-label={`Aprovar ${request.type === "TRANSFER" ? "transferência" : "cadastro"} de ${request.name}`}
                          onClick={() => {
                            review.mutate({
                              id: request.id,
                              decision: "APPROVED",
                              type: request.type,
                              classroomId: request.type === "TRANSFER" ? Number(selectedClassrooms[`TRANSFER:${request.id}`]) : undefined,
                              ...(kind === "STUDENT" && request.type !== "TRANSFER" ? { identityChecked: true } : {}),
                            });
                          }}
                          className="min-h-11 flex-1 rounded-lg bg-(--blue-dark) px-5 text-sm font-medium text-white hover:bg-[#076a83] disabled:opacity-50 sm:min-w-28"
                        >
                          {review.isPending &&
                            review.variables?.id === request.id &&
                            review.variables.type === request.type &&
                            review.variables.decision === "APPROVED"
                            ? "Aprovando…"
                            : "Aprovar"}
                        </button>
                      </div>
                    ) : (
                      <span className="mt-4 block border-t border-(--line) pt-4 text-sm font-medium text-(--muted)">
                        {status === "APPROVED" ? "Aprovado" : "Recusado"}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          )}
          {pages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--line) pt-5">
              <p role="status" className="text-sm text-(--muted)">
                Página {current + 1} de {pages}
              </p>
              <div className="flex gap-3">
                <Button
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  Anterior
                </Button>
                <Button
                  disabled={current + 1 >= pages}
                  onClick={() => setPage(current + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
function CoordinatorRegistrations() {
  const [status, setStatus] = useState<RegistrationStatus>("PENDING");
  const [page, setPage] = useState(0);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["registration-requests", status, page],
    queryFn: async ({ signal }) => {
      const result = await registrationApi.list(status, page, signal);
      return { ...result, content: result.content.filter((request) => request.role === "PEDAGOGICAL_COORDINATOR" && request.type !== "TRANSFER") };
    },
  });
  const review = useApiMutation(
    async ({ id, decision }: { id: number; decision: RegistrationStatus; }) => {
      await registrationApi.review(id, decision, "");
      await client.invalidateQueries({ queryKey: ["registration-requests"] });
    },
  );
  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <Select
          id="registrationStatus"
          label="Situação"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as RegistrationStatus);
            setPage(0);
          }}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      {query.isPending && <p role="status">Carregando solicitações…</p>}
      <ErrorMessage error={query.error} />
      {query.isError && (
        <Button onClick={() => query.refetch()}>Tentar novamente</Button>
      )}
      {query.data && !query.data.content.length && <EmptyState />}
      {status === "APPROVED" ? (
        <section className="overflow-hidden rounded-xl border border-(--line) bg-white">
          <div className="border-b border-(--line) px-4 py-3">
            <h2 className="text-lg font-semibold">Cadastros aprovados</h2>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {query.data?.content.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--paper)] sm:flex-nowrap"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1f5f8] text-xs font-semibold text-(--blue)"
                >
                  {request.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                    .toLocaleUpperCase("pt-BR")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-[var(--ink)]">
                    {request.name}
                  </h3>
                  <p className="break-all text-xs text-(--muted)">
                    {request.email} · Matrícula: {request.ra || "Não informado"}
                  </p>
                </div>
                <span className="ml-12 rounded-full bg-[#e1f5f8] px-2.5 py-1 text-[10px] font-medium text-(--blue) sm:ml-0">
                  {roleLabels[request.role]}
                </span>
                <span className="text-xs text-(--muted)">
                  {request.schoolName}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {query.data?.content.map((request) => (
            <article
              key={request.id}
              className="space-y-3 rounded-2xl border border-(--line) bg-white p-6"
            >
              <h2 className="wrap-break-word text-lg font-semibold">
                {request.name}
              </h2>
              <p className="text-sm text-(--muted)">
                {roleLabels[request.role]} · {request.schoolName}
              </p>
              {request.hasPhoto && <RegistrationPhoto id={request.id} />}
              <p className="break-all text-sm">{request.email}</p>
              <p className="text-sm">Matrícula: {request.ra}</p>
              {request.birthDate && (
                <p className="text-sm">
                  Nascimento: {request.birthDate.split("-").reverse().join("/")}
                </p>
              )}
              {request.reviewReason && (
                <p className="whitespace-pre-wrap text-sm">
                  Parecer: {request.reviewReason}
                </p>
              )}
              {status === "PENDING" && (
                <div className="flex gap-3">
                  <Button
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({ id: request.id, decision: "APPROVED" })
                    }
                  >
                    Aprovar
                  </Button>
                  <Button
                    disabled={review.isPending}
                    variant="danger"
                    onClick={() =>
                      review.mutate({ id: request.id, decision: "REJECTED" })
                    }
                  >
                    Recusar
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {query.data && query.data.totalPages > 1 && (
        <div className="flex items-center gap-4">
          <Button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="shrink-0 text-sm">
            Página {page + 1} de {query.data.totalPages}
          </span>
          <Button
            disabled={page + 1 >= query.data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}

/** Admin view: coordinator registrations plus the guardian-confirmation queue (support). */
export function Requests() {
  const [tab, setTab] = useState<"REGISTRATIONS" | "GUARDIAN">("REGISTRATIONS");
  return (
    <div className="space-y-6">
      <nav aria-label="Tipo de solicitação" className="flex gap-2 overflow-x-auto border-b border-(--line)">
        {(
          [
            { value: "REGISTRATIONS", label: "Cadastros", icon: Users },
            { value: "GUARDIAN", label: "Responsáveis", icon: UserCheck },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`flex min-h-14 items-center gap-3 rounded-t-xl border-b-2 px-5 text-sm font-medium sm:px-7 ${tab === value ? "border-(--blue) bg-cyan-50 text-(--blue-dark)" : "border-transparent text-(--muted) hover:bg-white"}`}
          >
            <Icon size={22} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      {tab === "GUARDIAN" ? <GuardianQueue /> : <CoordinatorRegistrations />}
    </div>
  );
}

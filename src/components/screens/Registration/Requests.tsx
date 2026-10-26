"use client";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import {
  registrationApi,
  type RegistrationStatus,
} from "@/integrations/registration/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import type { UserRole } from "@/interfaces/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Search, Users, Trash2 } from "lucide-react";
import { AccountDeletions } from "./AccountDeletions";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorMessage,
  Protected,
  Workspace,
} from "../Integration/shared";

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
function RegistrationPhoto({ id }: { id: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    registrationApi
      .photo(id, controller.signal)
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
  }, [id]);
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
export function RegistrationRequests({
  role,
  initialType = "TEACHER",
}: {
  role: UserRole;
  initialType?: "TEACHER" | "DELETION";
}) {
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace
          user={user}
          title={
            role === "coordenador" ? "Solicitações" : "Solicitações de cadastro"
          }
          description="Acompanhe e aprove solicitações pendentes da plataforma."
        >
          {role === "coordenador" ? (
            <CoordinatorRequests initialType={initialType} />
          ) : (
            <Requests />
          )}
        </Workspace>
      )}
    </Protected>
  );
}

function CoordinatorRequests({
  initialType,
}: {
  initialType: "TEACHER" | "DELETION";
}) {
  const [kind, setKind] = useState<"TEACHER" | "STUDENT" | "DELETION">(
    initialType,
  );
  const [status, setStatus] = useState<RegistrationStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["registration-requests", "coordinator", status],
    enabled: kind !== "DELETION",
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
  const review = useApiMutation(
    async ({
      id,
      decision,
    }: {
      id: number;
      decision: "APPROVED" | "REJECTED";
    }) => {
      await registrationApi.review(id, decision, "");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["registration-requests"] }),
        client.invalidateQueries({ queryKey: ["users"] }),
      ]);
    },
  );
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const filtered = (query.data ?? []).filter(
    (request) =>
      request.role === kind &&
      normalize(
        `${request.name} ${request.email} ${request.ra} ${request.schoolName}`,
      ).includes(normalize(search.trim())),
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
            <ErrorMessage error={review.error || query.error} />
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
            <ul className="divide-y divide-(--line)">
              {filtered
                .slice(current * 10, current * 10 + 10)
                .map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-wrap items-center gap-4 py-6 sm:flex-nowrap"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-(--blue-dark)"
                    >
                      {request.name
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <div className="min-w-0 flex-1 basis-[calc(100%-5rem)] sm:basis-auto">
                      <h3 className="break-words text-base font-semibold">
                        {request.name}
                      </h3>
                      <p className="mt-1 break-all text-sm text-(--muted)">
                        {request.email}
                      </p>
                    </div>
                    {status === "PENDING" ? (
                      <div className="flex w-full shrink-0 gap-3 sm:w-auto">
                        <button
                          type="button"
                          disabled={review.isPending}
                          aria-label={`Recusar cadastro de ${request.name}`}
                          onClick={() => {
                            review.mutate({
                              id: request.id,
                              decision: "REJECTED",
                            });
                          }}
                          className="min-h-11 flex-1 rounded-lg border border-slate-400 px-5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 sm:min-w-28"
                        >
                          {review.isPending &&
                          review.variables?.id === request.id &&
                          review.variables.decision === "REJECTED"
                            ? "Recusando…"
                            : "Recusar"}
                        </button>
                        <button
                          type="button"
                          disabled={review.isPending}
                          aria-label={`Aprovar cadastro de ${request.name}`}
                          onClick={() => {
                            review.mutate({
                              id: request.id,
                              decision: "APPROVED",
                            });
                          }}
                          className="min-h-11 flex-1 rounded-lg bg-(--blue-dark) px-5 text-sm font-medium text-white hover:bg-[#076a83] disabled:opacity-50 sm:min-w-28"
                        >
                          {review.isPending &&
                          review.variables?.id === request.id &&
                          review.variables.decision === "APPROVED"
                            ? "Aprovando…"
                            : "Aprovar"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-(--muted)">
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
function Requests() {
  const [status, setStatus] = useState<RegistrationStatus>("PENDING");
  const [page, setPage] = useState(0);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["registration-requests", status, page],
    queryFn: ({ signal }) => registrationApi.list(status, page, signal),
  });
  const review = useApiMutation(
    async ({ id, decision }: { id: number; decision: RegistrationStatus }) => {
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
                    {request.email} · RA: {request.ra || "Não informado"}
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
              <p className="text-sm">RA: {request.ra}</p>
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
                    className="bg-red-700"
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

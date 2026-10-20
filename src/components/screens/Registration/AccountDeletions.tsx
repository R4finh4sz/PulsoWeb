"use client";

import {
  ErrorMessage,
  EmptyState,
} from "@/components/screens/Integration/shared";
import {
  accountDeletionsApi,
  type AccountDeletion,
} from "@/integrations/profile/deletions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function AccountDeletions() {
  const [status, setStatus] = useState<AccountDeletion["status"]>("PENDING");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | AccountDeletion["role"]>("ALL");
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (selected !== null) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [selected]);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["account-deletion-requests", status],
    queryFn: ({ signal }) => accountDeletionsApi.list(status, signal),
  });
  const mutation = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: number;
      decision: "APPROVED" | "REJECTED";
    }) => accountDeletionsApi.review(id, decision),
    onSuccess: async () => {
      setSelected(null);
      await Promise.all(
        [
          "account-deletion-requests",
          "teacher-profile",
          "users",
          "classrooms",
          "subjects",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
    },
  });
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const requests = (query.data ?? []).filter(
    (request) =>
      (role === "ALL" || request.role === role) &&
      normalize(`${request.name} ${request.email}`).includes(
        normalize(search.trim()),
      ),
  );
  return (
    <section
      aria-label="Pedidos de exclusão de conta"
      className="rounded-2xl border border-(--line) bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <Trash2 size={21} aria-hidden="true" className="text-(--blue-dark)" />
          Exclusões de conta
        </h2>
        <select
          aria-label="Situação dos pedidos de exclusão"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AccountDeletion["status"]);
            setSelected(null);
          }}
          className="min-h-11 rounded-lg border border-(--line) bg-white px-3 text-sm"
        >
          <option value="PENDING">Pendentes</option>
          <option value="APPROVED">Aprovados</option>
          <option value="REJECTED">Recusados</option>
        </select>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg border border-(--line) px-4 focus-within:ring-2 focus-within:ring-(--focus)">
          <Search size={18} aria-hidden="true" className="shrink-0" />
          <input
            type="search"
            aria-label="Buscar pedido de exclusão"
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 w-full bg-transparent text-sm outline-none"
          />
        </label>
        <select
          aria-label="Filtrar exclusões por tipo de usuário"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as "ALL" | AccountDeletion["role"]);
            setSelected(null);
          }}
          className="min-h-12 rounded-lg border border-(--line) bg-white px-4 text-sm focus:ring-2 focus:ring-(--focus)"
        >
          <option value="ALL">Alunos e professores</option>
          <option value="STUDENT">Somente alunos</option>
          <option value="TEACHER">Somente professores</option>
        </select>
      </div>
      <div className="mt-4">
        <ErrorMessage
          error={query.error || (selected === null ? mutation.error : null)}
        />
      </div>
      {query.isPending && (
        <p role="status" className="py-6 text-sm text-(--muted)">
          Carregando pedidos…
        </p>
      )}
      {query.isError && (
        <button
          type="button"
          onClick={() => query.refetch()}
          className="min-h-11 text-sm text-(--blue-dark) underline"
        >
          Tentar novamente
        </button>
      )}
      {query.isSuccess && !requests.length && (
        <EmptyState
          icon={Trash2}
          title={
            search || role !== "ALL"
              ? "Nenhum pedido encontrado com estes filtros."
              : "Nenhum pedido de exclusão nesta situação."
          }
        />
      )}
      {query.isSuccess && (
        <ul className="divide-y divide-(--line)">
          {requests.map((request) => (
            <li key={request.id} className="py-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words font-semibold">
                      {request.name}
                    </h3>
                    <span className="rounded-lg bg-cyan-50 px-2 py-1 text-xs text-(--blue-dark)">
                      {request.role === "TEACHER" ? "Professor" : "Aluno"}
                    </span>
                  </div>
                  <p className="mt-1 break-all text-sm text-(--muted)">
                    {request.email}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                    <span className="font-medium">Motivo: </span>
                    {request.reason}
                  </p>
                  <p className="mt-2 text-xs text-(--muted)">
                    Solicitado em{" "}
                    {new Date(request.createdAt).toLocaleDateString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </p>
                </div>
                {status === "PENDING" && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: request.id,
                          decision: "REJECTED",
                        })
                      }
                      className="min-h-11 rounded-lg border border-(--line) px-4 text-sm font-medium disabled:opacity-50"
                    >
                      Recusar pedido
                      <span className="sr-only"> de {request.name}</span>
                    </button>
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={(event) => {
                        trigger.current = event.currentTarget;
                        mutation.reset();
                        setSelected(request.id);
                      }}
                      className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                    >
                      Aprovar exclusão
                      <span className="sr-only"> de {request.name}</span>
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
        onClose={() => {
          setSelected(null);
          trigger.current?.focus();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(480px,calc(100vw-32px))] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-950/50 sm:p-8"
      >
        <span
          aria-hidden="true"
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700"
        >
          <Trash2 size={24} />
        </span>
        <h2 id={titleId} className="text-xl font-semibold">
          Excluir conta?
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-(--muted)">
          Você está aprovando a exclusão da conta de{" "}
          <strong className="break-words text-(--ink)">
            {query.data?.find((request) => request.id === selected)?.name}
          </strong>
          . Esta ação não pode ser desfeita.
        </p>
        <div className="mt-4">
          <ErrorMessage error={mutation.error} />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => dialog.current?.close()}
            className="min-h-11 rounded-lg border border-(--line) px-5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || selected === null}
            onClick={() => {
              if (selected !== null)
                mutation.mutate({ id: selected, decision: "APPROVED" });
            }}
            className="min-h-11 rounded-lg bg-red-700 px-5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
          >
            {mutation.isPending ? "Excluindo…" : "Confirmar exclusão da conta"}
          </button>
        </div>
      </dialog>
    </section>
  );
}

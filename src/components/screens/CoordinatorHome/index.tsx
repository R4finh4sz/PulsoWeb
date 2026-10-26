"use client";
import { normalizeText } from "@/utils/text";

import {
  ErrorMessage,
  actionClass
} from "@/components/screens/Integration/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMe } from "@/integrations/auth/hooks";
import { useClassrooms } from "@/integrations/classrooms/hooks";
import { BookOpen, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function CoordinatorWork() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const rooms = useClassrooms();
  const session = useMe();
  const schoolId = session.data?.schoolId;
  const classrooms = rooms.data?.filter(
    (room) =>
      (!schoolId || !room.schoolId || room.schoolId === schoolId) &&
      normalizeText(`${room.name} ${room.identifier}`).includes(
        normalizeText(search.trim()),
      ) &&
      (filter === "ALL" || room.teacherIds.length === 0),
  );

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="coordinator-classrooms"
        className="min-w-0 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="coordinator-classrooms" className="text-xl font-semibold">
              Turmas da escola
            </h2>
            <p className="mt-2 text-sm text-(--muted)">
              Escolha uma turma para ver os alunos e organizar os vínculos.
            </p>
          </div>
          <Link href="/coordinator/classrooms/new" className={actionClass}>
            <Plus size={18} aria-hidden="true" />{" "}
            <span className="ml-2">Criar turma</span>
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-(--line) bg-white px-4 focus-within:ring-2 focus-within:ring-(--focus)">
            <Search
              size={18}
              aria-hidden="true"
              className="shrink-0 text-(--muted)"
            />
            <input
              type="search"
              aria-label="Buscar turma por nome ou identificador"
              placeholder="Buscar turma"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select
            aria-label="Filtrar turmas por vínculo de professor"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-h-12 rounded-xl border border-(--line) bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-(--focus) sm:max-w-56"
          >
            <option value="ALL">Todas as turmas</option>
            <option value="UNASSIGNED">Sem professor vinculado</option>
          </select>
        </div>
        {rooms.isPending && (
          <p role="status" className="text-sm text-(--muted)">
            Carregando turmas…
          </p>
        )}
        <ErrorMessage error={rooms.error} />
        {rooms.isError && (
          <button
            type="button"
            onClick={() => rooms.refetch()}
            className="text-sm font-medium text-(--blue-dark) underline"
          >
            Tentar novamente
          </button>
        )}
        {rooms.isSuccess && !classrooms?.length && (
          <EmptyState
            icon={BookOpen}
            title={
              search || filter !== "ALL"
                ? "Nenhuma turma encontrada com estes filtros."
                : "Nenhuma turma cadastrada."
            }
          />
        )}
        {!!classrooms?.length && (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {classrooms.map((room) => (
              <li key={room.id} className="flex min-w-0">
                <Link
                  href={`/coordinator/classrooms/${room.id}`}
                  className="choice-card group flex h-full flex-col"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7fa] text-[#0789a5] transition-colors group-hover:bg-[#d9f1f6]">
                    <BookOpen aria-hidden="true" size={29} strokeWidth={1.7} />
                  </div>
                  <h3 className="break-words text-lg font-semibold leading-7 tracking-tight text-(--ink)">
                    {room.name}
                  </h3>
                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-[#e8f7fa] px-3 py-2 text-sm font-medium text-[#087e9b]">
                    <Users size={17} aria-hidden="true" />
                    {room.teacherIds.length}{" "}
                    {room.teacherIds.length === 1
                      ? "professor vinculado"
                      : "professores vinculados"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

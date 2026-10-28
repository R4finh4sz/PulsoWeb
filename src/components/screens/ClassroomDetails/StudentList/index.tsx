"use client";
import { EmptyState } from "@/components/ui/EmptyState";
import { getInitials, normalizeText } from "@/utils/text";

import type { User } from "@/integrations/types";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useState } from "react";


export function StudentList({
  students,
  onRemove,
  removing = false,
}: {
  students: User[];
  onRemove?: (student: User) => void;
  removing?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const term = normalizeText(search.trim());
  const filtered = students
    .filter((student) =>
      normalizeText(`${student.fullName} ${student.ra} ${student.email}`).includes(
        term,
      ),
    )
    .sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "pt-BR", { sensitivity: "base" }),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages - 1);
  const start = current * size;
  const visible = filtered.slice(start, start + size);
  const buttonClass =
    "flex h-11 w-11 items-center justify-center rounded-lg border border-(--line) text-(--blue-dark) enabled:hover:bg-cyan-50 disabled:opacity-40";

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-xl border border-(--line) px-3 py-2.5 focus-within:border-[var(--blue-dark)] focus-within:ring-2 focus-within:ring-cyan-100">
        <Search
          size={17}
          aria-hidden="true"
          className="shrink-0 text-(--muted)"
        />
        <input
          type="search"
          aria-label="Buscar alunos por nome, RA ou e-mail"
          placeholder="Buscar por nome, RA ou e-mail"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          className="min-w-0 w-full bg-transparent text-sm outline-none"
        />
      </label>
      <p role="status" className="text-xs text-(--muted)">
        {filtered.length} {filtered.length === 1 ? "aluno" : "alunos"}
        {term ? " encontrados" : " na turma"}
      </p>
      {!visible.length ? (
        <EmptyState
          title={
            students.length
              ? "Nenhum aluno encontrado. Tente outro nome ou RA."
              : "Nenhum aluno vinculado à turma."
          }
        />
      ) : (
        <ul
          aria-label="Alunos da turma"
          className="divide-y divide-[var(--line)]"
        >
          {visible.map((student) => (
            <li key={student.id} className="flex items-center gap-3 py-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f7fa] text-xs font-medium text-(--blue-dark)"
              >
                {getInitials(student.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">
                  {student.fullName}
                </p>
                <p className="break-all text-xs text-(--muted)">
                  RA: {student.ra || "Não informado"}
                </p>
              </div>
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Desvincular ${student.fullName}`}
                  disabled={removing}
                  onClick={() => onRemove(student)}
                  className="min-h-11 shrink-0 rounded-lg px-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Desvincular
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--line) pt-4">
          <label className="flex items-center gap-2 text-xs text-(--muted)">
            Por página
            <select
              aria-label="Alunos por página"
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
              className="min-h-11 rounded-lg border border-(--line) bg-white px-2 text-sm text-(--ink)"
            >
              {[10, 20, 40].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <nav
            aria-label="Paginação de alunos"
            className="flex items-center gap-2"
          >
            <button
              type="button"
              aria-label="Página anterior de alunos"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className={buttonClass}
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-xs tabular-nums text-(--muted)">
              Página {current + 1} de {pages}
            </span>
            <button
              type="button"
              aria-label="Próxima página de alunos"
              disabled={current + 1 >= pages}
              onClick={() => setPage(current + 1)}
              className={buttonClass}
            >
              <ArrowRight size={18} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

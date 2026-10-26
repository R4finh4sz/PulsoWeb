"use client";

import { ErrorMessage } from "@/components/screens/Integration/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { classroomsApi } from "@/integrations/classrooms/api";
import { subjectsApi } from "@/integrations/subjects/api";
import type { Classroom, User } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useState } from "react";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

function TeacherActions({ teacher, room }: { teacher: User; room: Classroom }) {
  const [confirm, setConfirm] = useState(false);
  const remove = useApiMutation(() =>
    classroomsApi.unassign(room.id, teacher.id),
  );
  return (
    <div className="mt-6 space-y-4 border-t border-(--line) pt-5">
      <ErrorMessage error={remove.error} />
      {confirm ? (
        <div className="space-y-3">
          <p className="text-sm">
            Desvincular <strong>{teacher.fullName}</strong> desta turma? O
            cadastro do professor será mantido.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => setConfirm(false)}
              className="min-h-11 rounded-lg border border-(--line) px-4 text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
              className="min-h-11 rounded-lg bg-red-700 px-4 text-sm text-white disabled:opacity-50"
            >
              {remove.isPending ? "Desvinculando…" : "Confirmar desvínculo"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm text-red-700 hover:bg-red-50"
        >
          <Trash2 size={16} aria-hidden="true" />
          Desvincular professor
        </button>
      )}
    </div>
  );
}

export function ClassroomDirectory({
  room,
  kind,
}: {
  room: Classroom;
  kind: "teachers" | "subjects";
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const teachers = useQuery({
    queryKey: ["classrooms", room.id, "teachers"],
    queryFn: ({ signal }) => classroomsApi.teachers(room.id, signal),
  });
  const subjects = useQuery({
    queryKey: ["subjects", room.id],
    queryFn: ({ signal }) => subjectsApi.list(room.id, signal),
  });
  const isTeacher = kind === "teachers";
  const query = isTeacher ? teachers : subjects;
  const title = isTeacher ? "Professores da turma" : "Matérias da turma";
  const Icon = isTeacher ? UserRound : BookOpen;
  const items = isTeacher
    ? (teachers.data ?? []).map((teacher) => ({
        id: teacher.id,
        name: teacher.fullName,
        detail: teacher.email,
        search: `${teacher.fullName} ${teacher.email} ${teacher.ra}`,
      }))
    : (subjects.data ?? []).map((subject) => ({
        id: subject.id,
        name: subject.name,
        detail: room.name,
        search: subject.name,
      }));
  const filtered = items
    .filter((item) => normalize(item.search).includes(normalize(search.trim())))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * 10, current * 10 + 10);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0];
  const teacher = isTeacher
    ? teachers.data?.find((item) => item.id === selected?.id)
    : undefined;
  const subject = !isTeacher
    ? subjects.data?.find((item) => item.id === selected?.id)
    : undefined;
  const linkedIds = subject ? (subject.teacherIds ?? [subject.teacherId]) : [];
  const linkedTeachers = (teachers.data ?? []).filter((item) =>
    linkedIds.includes(item.id),
  );
  const linkedSubjects = (subjects.data ?? []).filter((item) =>
    (item.teacherIds ?? [item.teacherId]).includes(selected?.id ?? -1),
  );
  const related = isTeacher ? subjects : teachers;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
      <section
        aria-label={title}
        className="min-w-0 rounded-2xl border border-(--line) bg-white p-4"
      >
        <h3 className="flex items-center gap-3 text-base font-semibold">
          <Icon size={21} aria-hidden="true" className="text-(--blue-dark)" />
          {title}
        </h3>
        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-lg border border-(--line) px-3 focus-within:ring-2 focus-within:ring-(--focus)">
          <Search
            size={17}
            aria-hidden="true"
            className="shrink-0 text-(--muted)"
          />
          <input
            type="search"
            aria-label={
              isTeacher
                ? "Buscar professor por nome, e-mail ou matrícula"
                : "Buscar matéria por nome"
            }
            placeholder={isTeacher ? "Buscar professor…" : "Buscar matéria…"}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
              setSelectedId(null);
            }}
            className="min-w-0 w-full bg-transparent text-xs outline-none"
          />
        </label>
        {query.isPending && (
          <p role="status" className="py-5 text-sm text-(--muted)">
            Carregando…
          </p>
        )}
        <div className="mt-3">
          <ErrorMessage error={query.error} />
        </div>
        {query.isError && (
          <button
            type="button"
            onClick={() => query.refetch()}
            className="min-h-11 text-sm text-(--blue-dark) underline"
          >
            Tentar novamente
          </button>
        )}
        {query.isSuccess && !filtered.length && (
          <EmptyState
            icon={Icon}
            title={
              search
                ? "Nenhum resultado para esta busca."
                : isTeacher
                  ? "Nenhum professor vinculado."
                  : "Nenhuma matéria cadastrada."
            }
          />
        )}
        <ul className="mt-3 space-y-1">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={selected?.id === item.id}
                onClick={() => setSelectedId(item.id)}
                className="flex min-h-18 w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left hover:bg-slate-50 aria-pressed:border-cyan-200 aria-pressed:bg-cyan-50"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f7fa] text-xs font-semibold text-(--blue-dark)"
                >
                  {isTeacher ? initials(item.name) : <BookOpen size={19} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="mt-1 block break-all text-xs text-(--muted)">
                    {item.detail}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-(--blue-dark)"
                />
              </button>
            </li>
          ))}
        </ul>
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-(--line) pt-4 text-xs">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => {
                setPage(current - 1);
                setSelectedId(null);
              }}
              className="min-h-10 px-2 text-(--blue-dark) disabled:opacity-40"
            >
              Anterior
            </button>
            <span role="status">
              {current + 1} de {pages}
            </span>
            <button
              type="button"
              disabled={current + 1 >= pages}
              onClick={() => {
                setPage(current + 1);
                setSelectedId(null);
              }}
              className="min-h-10 px-2 text-(--blue-dark) disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </section>
      {selected ? (
        <section
          aria-label={`${isTeacher ? "Perfil de" : "Detalhes de"} ${selected.name}`}
          className="min-w-0 rounded-2xl border border-(--line) bg-white p-5 sm:p-6"
        >
          <h3 className="flex items-center gap-3 text-lg font-semibold">
            <Icon size={21} aria-hidden="true" className="text-(--blue-dark)" />
            {isTeacher ? "Perfil do professor" : "Detalhes da matéria"}
          </h3>
          <div className="mt-6 flex items-center gap-4 border-b border-(--line) pb-6">
            <span
              aria-hidden="true"
              className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-2xl font-semibold text-(--blue-dark)"
            >
              {isTeacher ? initials(selected.name) : <BookOpen size={30} />}
            </span>
            <div className="min-w-0">
              <h4 className="break-words text-xl font-semibold">
                {selected.name}
              </h4>
              <p className="mt-1 break-all text-sm text-(--muted)">
                {selected.detail}
              </p>
              {teacher && (
                <p className="mt-1 text-sm text-(--muted)">
                  Matrícula: {teacher.ra || "Não informada"}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-cyan-50/50 p-4 sm:p-5">
            <h4 className="text-sm font-semibold">
              {isTeacher
                ? "Matérias nesta turma"
                : "Professores vinculados à matéria"}
            </h4>
            {related.isPending ? (
              <p role="status" className="mt-3 text-sm text-(--muted)">
                Carregando vínculos…
              </p>
            ) : related.isError ? (
              <div className="mt-3">
                <ErrorMessage error={related.error} />
                <button
                  type="button"
                  onClick={() => related.refetch()}
                  className="min-h-11 text-sm text-(--blue-dark) underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {(isTeacher
                  ? linkedSubjects.map((item) => ({
                      id: item.id,
                      name: item.name,
                    }))
                  : linkedTeachers.map((item) => ({
                      id: item.id,
                      name: item.fullName,
                    }))
                ).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 break-words text-sm"
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-(--blue-dark)"
                    />
                    {item.name}
                  </li>
                ))}
                {(isTeacher
                  ? !linkedSubjects.length
                  : !linkedTeachers.length) && (
                  <li className="text-sm text-(--muted)">
                    {isTeacher
                      ? "Nenhuma matéria vinculada a este professor nesta turma."
                      : "Nenhum professor vinculado à matéria nesta turma."}
                  </li>
                )}
              </ul>
            )}
          </div>
          {teacher && (
            <TeacherActions key={teacher.id} teacher={teacher} room={room} />
          )}
        </section>
      ) : (
        <div className="rounded-2xl border border-(--line) bg-white p-8 text-sm text-(--muted)">
          {query.isPending
            ? "Preparando os dados da turma…"
            : isTeacher
              ? "Selecione um professor na lista para consultar o perfil."
              : "Selecione uma matéria na lista para consultar os detalhes."}
        </div>
      )}
    </div>
  );
}

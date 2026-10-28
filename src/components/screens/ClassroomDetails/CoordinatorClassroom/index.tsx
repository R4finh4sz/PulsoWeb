"use client";
import { getInitials, normalizeText } from "@/utils/text";
import { ClassroomDirectory } from "../ClassroomDirectory";

import {
  ErrorMessage,
  actionClass,
} from "@/components/screens/Integration/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { classroomsApi } from "@/integrations/classrooms/api";
import type { Classroom, User } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

function StudentProfile({ student, room }: { student: User; room: Classroom; }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const remove = useApiMutation(() =>
    classroomsApi.unenroll(room.id, student.id),
  );

  return (
    <section
      aria-label={`Perfil de ${student.fullName}`}
      className="min-w-0 rounded-2xl border border-(--line) bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-3 text-lg font-semibold">
          <UserRound
            size={21}
            aria-hidden="true"
            className="text-(--blue-dark)"
          />
          Perfil do aluno
        </h3>
      </div>
      <div className="mt-6 flex items-center gap-4 border-b border-(--line) pb-6">
        <span
          aria-hidden="true"
          className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-2xl font-semibold text-(--blue-dark)"
        >
          {getInitials(student.fullName)}
        </span>
        <div className="min-w-0">
          <h4 className="break-words text-xl font-semibold">
            {student.fullName}
          </h4>
          <p className="mt-1 break-words text-sm text-(--muted)">
            RA: {student.ra || "Não informado"}
          </p>
          <p className="mt-1 break-all text-sm text-(--muted)">
            {student.email || "E-mail não informado"}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            Vinculado à turma
          </span>
        </div>
      </div>
      <section
        aria-label="Dados e contato"
        className="mt-6 rounded-xl bg-cyan-50/50 p-4 sm:p-5"
      >
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <FileText
            size={18}
            aria-hidden="true"
            className="text-(--blue-dark)"
          />
          Dados e contato
        </h4>
        <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {[
            ["Nome completo", student.fullName],
            ["RA / matrícula", student.ra || "Não informado"],
            ["E-mail", student.email || "Não informado"],
            ["Turma", room.name],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-(--muted)">{label}</dt>
              <dd className="mt-1 break-words text-sm [overflow-wrap:anywhere]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="mt-6 border-t border-(--line) pt-5">
        <ErrorMessage error={remove.error} />
        {confirmRemove ? (
          <div className="space-y-4">
            <p className="text-sm">
              Remover o vínculo de <strong>{student.fullName}</strong> com esta
              turma? O cadastro do aluno será mantido.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => setConfirmRemove(false)}
                className="min-h-11 rounded-lg border border-(--line) px-4 text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
                className="min-h-11 rounded-lg bg-[#e83e32] px-4 text-sm font-medium text-white hover:bg-[#cf3026] disabled:opacity-50"
              >
                {remove.isPending ? "Removendo…" : "Confirmar remoção"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} aria-hidden="true" />
            Remover da turma
          </button>
        )}
      </div>
    </section>
  );
}

function ClassroomStudents({ room }: { room: Classroom; }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["classrooms", room.id, "students"],
    queryFn: ({ signal }) => classroomsApi.students(room.id, signal),
  });
  const students = (query.data ?? [])
    .filter((student) =>
      normalizeText(`${student.fullName} ${student.ra}`).includes(
        normalizeText(search.trim()),
      ),
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
  const pages = Math.max(1, Math.ceil(students.length / 10));
  const current = Math.min(page, pages - 1);
  const visible = students.slice(current * 10, current * 10 + 10);
  const selected =
    visible.find((student) => student.id === selectedId) ?? visible[0];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
      <section
        aria-label="Alunos da turma"
        className="min-w-0 rounded-2xl border border-(--line) bg-white p-4"
      >
        <h3 className="flex items-center gap-3 text-base font-semibold">
          <Users size={21} aria-hidden="true" className="text-(--blue-dark)" />
          Alunos da turma
        </h3>
        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-lg border border-(--line) px-3 focus-within:ring-2 focus-within:ring-(--focus)">
          <Search
            size={17}
            aria-hidden="true"
            className="shrink-0 text-(--muted)"
          />
          <input
            type="search"
            aria-label="Buscar aluno por nome ou RA"
            placeholder="Buscar aluno por nome ou RA…"
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
            Carregando alunos…
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
        {query.isSuccess && !students.length && (
          <EmptyState
            icon={Users}
            title={
              search
                ? "Nenhum aluno encontrado."
                : "Nenhum aluno vinculado à turma."
            }
          />
        )}
        <ul className="mt-3 space-y-1">
          {visible.map((student) => (
            <li key={student.id}>
              <button
                type="button"
                aria-pressed={selected?.id === student.id}
                onClick={() => setSelectedId(student.id)}
                className="flex min-h-18 w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left hover:bg-slate-50 aria-pressed:border-cyan-200 aria-pressed:bg-cyan-50"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f7fa] text-xs font-semibold text-(--blue-dark)"
                >
                  {getInitials(student.fullName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium">
                    {student.fullName}
                  </span>
                  <span className="mt-1 block break-words text-xs text-(--muted)">
                    RA: {student.ra || "Não informado"}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-(--blue-dark)"
                />
              </button>
            </li>
          ))}
        </ul>
        {pages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-(--line) pt-4 text-xs">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => {
                setPage(current - 1);
                setSelectedId(null);
              }}
              className="min-h-10 rounded-lg px-2 text-(--blue-dark) disabled:opacity-40"
            >
              Anterior
            </button>
            <span role="status" className="tabular-nums text-(--muted)">
              {current + 1} de {pages}
            </span>
            <button
              type="button"
              disabled={current + 1 >= pages}
              onClick={() => {
                setPage(current + 1);
                setSelectedId(null);
              }}
              className="min-h-10 rounded-lg px-2 text-(--blue-dark) disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </section>
      {selected ? (
        <StudentProfile key={selected.id} student={selected} room={room} />
      ) : (
        <div className="rounded-2xl border border-(--line) bg-white p-8 text-sm text-(--muted)">
          {query.isPending
            ? "Preparando os dados da turma…"
            : "Selecione um aluno na lista para consultar o perfil."}
        </div>
      )}
    </div>
  );
}

function DeleteClassroom({ room }: { room: Classroom; }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const router = useRouter();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => classroomsApi.remove(room.id),
    onSuccess: async () => {
      await Promise.all(
        [
          "classrooms",
          "subjects",
          "users",
          "teacher-report",
          "teacher-activities",
          "registration-requests",
        ].map((key) =>
          client.invalidateQueries({ queryKey: [key], refetchType: "none" }),
        ),
      );
      router.replace("/coordinator");
    },
  });
  return (
    <section
      aria-label="Excluir turma"
      className="rounded-2xl border border-(--line) bg-white p-5 sm:p-6"
    >
      <h3 className="text-base font-semibold">Excluir turma</h3>
      <p className="mt-2 text-sm text-(--muted)">
        A turma e seus vínculos serão excluídos. Os cadastros de alunos e
        professores serão mantidos.
      </p>
      <div className="mt-4">
        <ErrorMessage error={mutation.error} />
      </div>
      {confirming ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (confirmation === room.name && !mutation.isPending)
              mutation.mutate();
          }}
        >
          <p className="text-sm">
            Esta ação não pode ser desfeita. Para confirmar, digite{" "}
            <strong>{room.name}</strong>.
          </p>
          <label className="block text-sm">
            Nome da turma
            <input
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={mutation.isPending}
              className="mt-2 block min-h-12 w-full max-w-md rounded-lg border border-(--line) px-4 focus:ring-2 focus:ring-(--focus)"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => {
                setConfirming(false);
                setConfirmation("");
                mutation.reset();
              }}
              className="min-h-11 rounded-lg border border-(--line) px-4 text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={confirmation !== room.name || mutation.isPending}
              className="min-h-11 rounded-lg bg-[#e83e32] px-4 text-sm font-medium text-white hover:bg-[#cf3026] disabled:opacity-50"
            >
              {mutation.isPending ? "Excluindo…" : "Confirmar exclusão"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          <Trash2 size={16} aria-hidden="true" />
          Excluir sala
        </button>
      )}
    </section>
  );
}

export function CoordinatorClassroom({
  room,
  studentsAssignment,
  teachers,
  edit,
}: {
  room: Classroom;
  studentsAssignment: ReactNode;
  teachers: ReactNode;
  edit: ReactNode;
}) {
  const [section, setSection] = useState("students");
  const [linking, setLinking] = useState(false);
  return (
    <div className="space-y-6">
      <Link
        href="/coordinator"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-(--blue-dark)"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Link>
      <div className="flex flex-wrap items-center gap-4 border-b border-(--line) pb-6">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-(--blue-dark)"
        >
          <BookOpen size={27} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-semibold">{room.name}</h2>
        </div>
        {(section === "students" || section === "teachers") && (
          <button
            type="button"
            aria-expanded={linking}
            onClick={() => {
              setLinking(!linking);
            }}
            className={actionClass}
          >
            <Plus size={17} aria-hidden="true" />
            <span className="ml-2">
              {linking
                ? "Fechar vínculo"
                : section === "teachers"
                  ? "Vincular professor"
                  : "Vincular aluno"}
            </span>
          </button>
        )}
      </div>
      <nav
        aria-label="Seções da turma"
        className="flex gap-2 overflow-x-auto border-b border-(--line)"
      >
        {[
          { id: "students", label: "Alunos", icon: Users },
          { id: "teachers", label: "Professores", icon: UserRound },
          { id: "subjects", label: "Matérias", icon: BookOpen },
          { id: "settings", label: "Dados da turma", icon: Pencil },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            onClick={() => {
              setSection(id);
              setLinking(false);
            }}
            className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 text-sm font-medium ${section === id ? "border-(--blue-dark) bg-cyan-50 text-(--blue-dark)" : "border-transparent text-(--muted) hover:bg-white"}`}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      {section === "students" && (
        <>
          {linking && (
            <section
              aria-label="Vincular aluno à turma"
              className="rounded-2xl border border-(--line) bg-white p-5"
            >
              {studentsAssignment}
            </section>
          )}
          <ClassroomStudents room={room} />
        </>
      )}
      {section === "teachers" && (
        <>
          {linking && (
            <section
              aria-label="Vincular professor à turma"
              className="rounded-2xl border border-(--line) bg-white p-5"
            >
              {teachers}
            </section>
          )}
          <ClassroomDirectory key="teachers" room={room} kind="teachers" />
        </>
      )}
      {section === "subjects" && (
        <ClassroomDirectory key="subjects" room={room} kind="subjects" />
      )}
      {section === "settings" && (
        <div className="space-y-6">
          {edit}
          <DeleteClassroom room={room} />
        </div>
      )}
    </div>
  );
}

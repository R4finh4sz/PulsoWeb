"use client";
import { useActiveSchool } from "@/integrations/auth/hooks";
import { useAuthState } from "@/integrations/auth/state";
import { useRouter } from "next/navigation";

import { CoordinatorClassroom } from "@/components/screens/ClassroomDetails/CoordinatorClassroom";
import { StudentList } from "@/components/screens/ClassroomDetails/StudentList";
import { SubjectCard } from "@/components/screens/ClassroomDetails/SubjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { classroomsApi } from "@/integrations/classrooms/api";
import { useClassroom, useClassrooms } from "@/integrations/classrooms/hooks";
import { MAX_SUBJECTS, subjectsApi } from "@/integrations/subjects/api";
import type { Classroom, CreateClassroom, User } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { usersApi } from "@/integrations/users/api";
import { useUsers } from "@/integrations/users/hooks";
import type { SessionUser, UserRole } from "@/interfaces/auth";
import { homeRoutes } from "@/interfaces/auth";
import {
  ClassroomSelectionSchema,
  classroomLetters,
  classroomPeriods,
  classroomYears,
} from "@/validation/Classroom.validation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  ErrorMessage,
  actionClass,
  fieldClass
} from "@/components/screens/Integration/shared";
export const base = (role: UserRole) => homeRoutes[role];
export function ClassroomList({
  user,
  schoolId,
}: {
  user: SessionUser;
  schoolId?: number;
}) {
  const query = useClassrooms(true, user.role === "professor");
  const activeSchool = useActiveSchool();
  const activeSchoolId = useAuthState((state) => state.session?.user.schoolId);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const rooms = query.data?.filter(
    (room) =>
      (schoolId === undefined || room.schoolId === schoolId) &&
      (room.name.toLocaleLowerCase("pt-BR").includes(term) ||
        room.identifier.toLocaleLowerCase("pt-BR").includes(term) ||
        (user.role === "professor" &&
          !!room.schoolName?.toLocaleLowerCase("pt-BR").includes(term))),
  );
  if (user.role === "professor")
    return (
      <section aria-label="Minhas turmas" className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-slate-400"
            />
            <input
              type="search"
              aria-label="Buscar turmas por nome, identificador ou escola"
              placeholder="Buscar turma ou escola"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
        {query.isPending && (
          <p role="status" className="text-sm text-slate-500">
            Carregando turmas…
          </p>
        )}
        <ErrorMessage error={query.error || activeSchool.error} />
        {query.isError && (
          <button
            type="button"
            onClick={() => query.refetch()}
            className="text-sm font-medium text-cyan-800 underline"
          >
            Tentar novamente
          </button>
        )}
        {query.isSuccess && !rooms?.length && (
          <EmptyState
            icon={BookOpen}
            title={
              term
                ? "Nenhuma turma encontrada para esta busca."
                : "Nenhuma turma disponível."
            }
          />
        )}
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rooms?.map((room) => (
            <li key={room.id} className="flex">
              <Link
                href={`/teacher/classrooms/${room.id}`}
                aria-disabled={activeSchool.isPending}
                onClick={(event) => {
                  if (activeSchool.isPending) {
                    event.preventDefault();
                    return;
                  }
                  if (room.schoolId && room.schoolId !== activeSchoolId) {
                    event.preventDefault();
                    activeSchool.mutate(room.schoolId, {
                      onSuccess: () =>
                        router.push(`/teacher/classrooms/${room.id}`),
                    });
                  }
                }}
                className="choice-card group"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7fa] text-[#0789a5] transition group-hover:bg-[#d9f1f6]">
                  <BookOpen aria-hidden="true" size={29} strokeWidth={1.7} />
                </div>
                <h2 className="text-lg font-semibold leading-7 tracking-tight text-[var(--ink)]">
                  {room.name}
                </h2>
                <p className="mt-2 text-sm text-(--muted)">
                  {room.schoolName || "Escola não informada"}
                </p>

                <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#e8f7fa] px-3 py-2 text-sm font-medium text-[#087e9b]">
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
      </section>
    );
  return (
    <section className="space-y-4 rounded-xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Turmas cadastradas</h2>
        {(user.role === "coordenador" || user.role === "admin") && (
          <Link
            className={actionClass}
            href={base(user.role) + "/classrooms/new"}
          >
            Criar turma
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-(--line) bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-(--line) p-3">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-(--line) bg-[var(--paper)] px-3 py-2 focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20">
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-(--muted)"
            />
            <input
              type="search"
              aria-label="Buscar turmas por nome ou identificador"
              placeholder="Buscar por nome"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-(--muted)"
            />
          </label>
        </div>
        {query.isPending && (
          <p role="status" className="p-4 text-sm text-(--muted)">
            Carregando turmas…
          </p>
        )}
        {query.error && (
          <div className="p-3">
            <ErrorMessage error={query.error} />
          </div>
        )}
        {query.data && !rooms?.length && (
          <EmptyState
            icon={BookOpen}
            title={
              term
                ? "Nenhuma turma encontrada para esta busca."
                : "Nenhuma turma disponível."
            }
          />
        )}
        <ul className="divide-y divide-[var(--line)]">
          {rooms?.map((room) => (
            <li key={room.id}>
              <Link
                href={base(user.role) + "/classrooms/" + room.id}
                className="flex flex-wrap items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--blue)] sm:flex-nowrap"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1f5f8] text-(--blue)"
                >
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-[var(--ink)]">
                    {room.name} · {room.identifier}
                  </h3>
                  <p className="text-xs text-(--muted)">
                    {room.teacherIds.length}{" "}
                    {room.teacherIds.length === 1
                      ? "professor vinculado"
                      : "professores vinculados"}
                  </p>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="ml-auto h-4 w-4 shrink-0 text-(--muted) sm:ml-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
export function ClassroomForm({
  existing,
  onCreated,
}: {
  existing?: Classroom;
  onCreated?: (room: Classroom) => void;
}) {
  const [success, setSuccess] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const mutation = useApiMutation(
    (body: Partial<CreateClassroom> & Pick<CreateClassroom, "name">) =>
      existing
        ? classroomsApi.update(existing.id, body)
        : classroomsApi.create({
          name: body.name,
          identifier: body.identifier!,
        }),
  );
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSuccess(false);
    setSelectionError("");
    try {
      const selection = existing
        ? null
        : ClassroomSelectionSchema.safeParse({
            year: String(data.get("year") ?? ""),
            identifier: String(data.get("identifier") ?? ""),
            period: String(data.get("period") ?? ""),
          });
      if (selection && !selection.success) {
        setSelectionError(selection.error.issues[0].message);
        return;
      }
      const room = await mutation.mutateAsync({
        name: selection?.success
          ? `${selection.data.year}º ano · ${selection.data.period}`
          : String(data.get("name")).trim(),
        ...(selection?.success
          ? { identifier: selection.data.identifier }
          : {}),
      });
      setSuccess(true);
      onCreated?.(room);
    } catch {
      /* Render the server error. */
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6">
      {!existing ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            Ano
            <select name="year" required defaultValue="" className={fieldClass}>
              <option value="" disabled>
                Selecione o ano
              </option>
              {classroomYears.map((year) => (
                <option key={year} value={year}>
                  {year}º ano
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Turma
            <select
              name="identifier"
              required
              defaultValue=""
              className={fieldClass}
            >
              <option value="" disabled>
                Selecione a turma
              </option>
              {classroomLetters.map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Turno
            <select
              name="period"
              required
              defaultValue=""
              className={fieldClass}
            >
              <option value="" disabled>
                Selecione o turno
              </option>
              {classroomPeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <>
          <label className="block text-sm">
            Nome da turma
            <input
              name="name"
              maxLength={100}
              required
              defaultValue={existing?.name}
              placeholder="3º ano"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            Identificador
            <input
              name="identifier"
              pattern={existing ? undefined : "[A-Z]"}
              maxLength={existing ? undefined : 1}
              required={!existing}
              readOnly={!!existing}
              disabled={!!existing}
              defaultValue={existing?.identifier}
              placeholder="A"
              title={
                existing
                  ? "Identificador definido pelo sistema"
                  : "Uma letra maiúscula de A a Z"
              }
              className={`${fieldClass} read-only:bg-slate-50 read-only:text-(--muted)`}
            />
          </label>
        </>
      )}
      {selectionError && (
        <p role="alert" className="text-sm text-red-700">
          {selectionError}
        </p>
      )}
      <ErrorMessage error={mutation.error} />
      {success && <p role="status">Turma salva.</p>}
      <button disabled={mutation.isPending} className={actionClass}>
        {mutation.isPending ? "Salvando…" : "Salvar turma"}
      </button>
    </form>
  );
}
export function Assignment({
  room,
  resource,
}: {
  room: Classroom;
  resource: "students" | "teachers";
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState("");
  const [success, setSuccess] = useState(false);
  const students = useUsers(
    resource,
    { q, page, size: 20, schoolId: room.schoolId },
    resource === "students",
  );
  const teachers = useQuery({
    queryKey: ["users", "teachers", "assignment", room.schoolId],
    enabled: resource === "teachers",
    queryFn: async ({ signal }) => {
      // GET /teachers scopes results to the authenticated coordinator's school.
      const filters = { size: 100 };
      const first = await usersApi.list(
        "teachers",
        { ...filters, page: 0 },
        signal,
      );
      const remaining = await Promise.all(
        Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
          usersApi.list("teachers", { ...filters, page: index + 1 }, signal),
        ),
      );
      return [first, ...remaining].flatMap((result) => result.content);
    },
  });
  const people = resource === "teachers" ? teachers : students;
  const mutation = useApiMutation(async (id: number) =>
    resource === "students"
      ? classroomsApi.enroll(room.id, id)
      : classroomsApi.assign(room.id, id),
  );
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const availableTeachers = (teachers.data ?? []).filter(
    (person) =>
      !room.teacherIds.includes(person.id) &&
      normalize(
        `${person.fullName} ${person.email} ${person.matricula ?? person.ra ?? ""}`,
      ).includes(normalize(q.trim())),
  );
  const available =
    resource === "teachers"
      ? availableTeachers.slice(page * 20, page * 20 + 20)
      : (students.data?.content ?? []).filter(
          (person) => person.classroomId !== room.id,
        );
  const totalPages =
    resource === "teachers"
      ? Math.ceil(availableTeachers.length / 20)
      : (students.data?.totalPages ?? 0);
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (
          !available.some((person) => String(person.id) === selected) ||
          mutation.isPending
        )
          return;
        setSuccess(false);
        try {
          await mutation.mutateAsync(Number(selected));
          setSelected("");
          setSuccess(true);
        } catch {
          /* Render below. */
        }
      }}
    >
      <h3 className="text-sm font-semibold">
        {resource === "students" ? "Vincular aluno" : "Vincular professor"}
      </h3>
      <input
        className={fieldClass}
        aria-label={
          resource === "teachers"
            ? "Buscar professor da escola"
            : "Buscar pessoa por nome ou RA"
        }
        placeholder={
          resource === "teachers"
            ? "Buscar professor por nome, e-mail ou matrícula"
            : "Buscar por nome ou RA"
        }
        value={q}
        onChange={(event) => {
          setQ(event.target.value);
          setPage(0);
          setSelected("");
        }}
      />
      {resource === "teachers" ? (
        <fieldset disabled={mutation.isPending} className="space-y-2">
          <legend className="text-sm text-(--muted)">
            Escolha o professor da escola que deseja vincular à turma.
          </legend>
          {available.map((person) => (
            <label
              key={person.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-(--line) bg-white p-4"
            >
              <input
                type="radio"
                name="teacher"
                value={person.id}
                checked={selected === String(person.id)}
                onChange={(event) => setSelected(event.target.value)}
              />
              <span>
                <span className="block text-sm font-medium">
                  {person.fullName}
                </span>
                <span className="block text-xs text-(--muted)">
                  {person.email}
                  {(person.matricula ?? person.ra)
                    ? ` · Matrícula: ${person.matricula ?? person.ra}`
                    : ""}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <select
          className={fieldClass}
          aria-label="Selecionar pessoa"
          required
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Selecione o aluno para vincular</option>
          {available.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName} · {person.ra}
              {resource === "students" && person.classroomId
                ? " (transferir de outra turma)"
                : ""}
            </option>
          ))}
        </select>
      )}
      {people.isSuccess && !available.length && (
        <p role="status" className="text-sm text-(--muted)">
          {resource === "teachers"
            ? q.trim()
              ? "Nenhum professor disponível com esse nome, e-mail ou matrícula nesta escola."
              : "Nenhum professor disponível para vincular. Confira se o convite da escola foi aceito ou se o professor já está nesta turma."
            : "Nenhum aluno disponível para vincular."}
        </p>
      )}
      {resource === "teachers" && teachers.isSuccess && !available.length && (
        <div className="space-y-2 text-sm text-(--muted)">
          <p>
            {teachers.data.length === 0
              ? "A API não retornou professores para a escola do coordenador. Cadastros concluídos por convite precisam ser aprovados em Solicitações; professores já cadastrados precisam aceitar o convite da escola."
              : `A API retornou ${teachers.data.length} professor(es) da escola. Professores já vinculados a esta turma não aparecem nesta seleção.`}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/coordinator/registration-requests"
              className="text-(--blue-dark) underline"
            >
              Ver solicitações de professores
            </Link>
            <button
              type="button"
              onClick={() => teachers.refetch()}
              className="text-(--blue-dark) underline"
            >
              Atualizar professores
            </button>
          </div>
        </div>
      )}
      {resource === "students" && (
        <p className="text-xs">
          Se o aluno já tiver turma, este vínculo fará a transferência.
        </p>
      )}
      {people.isPending && <p role="status">Carregando…</p>}
      <ErrorMessage error={people.error || mutation.error} />
      {success && <p role="status">Vínculo salvo.</p>}
      <div className="flex items-center gap-3">
        {totalPages > 1 && (
          <>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => {
                setPage(page - 1);
                setSelected("");
              }}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => {
                setPage(page + 1);
                setSelected("");
              }}
            >
              Próxima
            </button>
          </>
        )}
        <button
          className={actionClass}
          disabled={!selected || mutation.isPending}
        >
          {mutation.isPending ? "Vinculando…" : "Vincular"}
        </button>
      </div>
    </form>
  );
}
function Roster({
  room,
  resource,
  manager,
}: {
  room: Classroom;
  resource: "students" | "teachers";
  manager: boolean;
}) {
  const [selectedPerson, setSelectedPerson] = useState<User | null>(null);
  const removeDialog = useRef<HTMLDialogElement>(null);
  const titleId = `unlink-${resource}-${room.id}-title`;
  useEffect(() => {
    if (selectedPerson) removeDialog.current?.showModal();
    else removeDialog.current?.close();
  }, [selectedPerson]);
  const query = useQuery({
    queryKey: ["classrooms", room.id, resource],
    queryFn: ({ signal }) =>
      resource === "students"
        ? classroomsApi.students(room.id, signal)
        : classroomsApi.teachers(room.id, signal),
  });
  const mutation = useApiMutation((person: User) =>
    resource === "students"
      ? classroomsApi.unenroll(room.id, person.id)
      : classroomsApi.unassign(room.id, person.id),
  );
  return (
    <section className="min-w-0 space-y-5 rounded-2xl border border-(--line) bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        <Users aria-hidden="true" size={20} className="text-(--blue-dark)" />
        {resource === "students" ? "Alunos" : "Professores"} vinculados
      </h2>
      {manager && <Assignment room={room} resource={resource} />}
      {query.isPending && <p role="status">Carregando…</p>}
      <ErrorMessage error={query.error || mutation.error} />
      {query.isError && (
        <button
          type="button"
          onClick={() => query.refetch()}
          className="text-sm text-(--blue-dark) underline"
        >
          Tentar novamente
        </button>
      )}
      {resource === "students" ? (
        query.data && (
          <StudentList
            key={room.id}
            students={query.data}
            removing={mutation.isPending}
            onRemove={
              manager
                ? (person) => { mutation.reset(); setSelectedPerson(person); }
                : undefined
            }
          />
        )
      ) : (
        <>
          {query.data && !query.data.length && (
            <EmptyState icon={Users} title="Nenhum vínculo cadastrado." />
          )}
          <ul className="divide-y divide-[var(--line)]">
            {query.data?.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">
                    {person.fullName}
                  </p>
                  <p className="mt-1 break-all text-sm leading-6 text-(--muted)">
                    {person.email} · {person.ra}
                  </p>
                </div>
                {manager && (
                  <button
                    disabled={mutation.isPending}
                    onClick={() => {
                      mutation.reset();
                      setSelectedPerson(person);
                    }}
                    className="text-sm text-red-700"
                  >
                    Desvincular
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <dialog
        ref={removeDialog}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          if (!mutation.isPending) setSelectedPerson(null);
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-transparent p-0 backdrop:bg-black/70"
      >
        <FeedbackModalContent
          type="error"
          titleId={titleId}
          title="Desvincular da turma?"
          message={<>O vínculo de <strong>{selectedPerson?.fullName}</strong> com esta turma será removido. O cadastro será mantido.</>}
          actionLabel="Cancelar"
          autoFocusAction
          disabled={mutation.isPending}
          error={mutation.error ? <ErrorMessage error={mutation.error} /> : undefined}
          onClose={() => setSelectedPerson(null)}
          secondaryAction={{
            label: mutation.isPending ? "Desvinculando…" : "Sim, desvincular",
            destructive: true,
            onClick: async () => {
              if (!selectedPerson || mutation.isPending) return;
              try {
                await mutation.mutateAsync(selectedPerson);
                setSelectedPerson(null);
              } catch {
                // Keep the confirmation open so the user can retry.
              }
            },
          }}
        />
      </dialog>
    </section>
  );
}
function Subjects({ room, user }: { room: Classroom; user: SessionUser; }) {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["subjects", room.id],
    queryFn: ({ signal }) => subjectsApi.list(room.id, signal),
  });
  const limitReached = (query.data?.length ?? 0) >= MAX_SUBJECTS;
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filteredSubjects = query.data?.filter((subject) =>
    subject.name.toLocaleLowerCase("pt-BR").includes(term),
  );
  return (
    <section className="min-w-0 space-y-6" aria-label="Disciplinas">
      <div>
        <h2 className="text-xl font-semibold">Disciplinas</h2>
        <p className="mt-2 text-sm leading-6 text-(--muted)">
          Conteúdos organizados por disciplina nesta turma.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-(--line) bg-white px-4 py-3 focus-within:border-[var(--blue-dark)] focus-within:ring-2 focus-within:ring-cyan-100">
          <Search size={18} aria-hidden="true" className="shrink-0 text-(--muted)" />
          <input
            type="search"
            aria-label="Buscar matérias"
            placeholder="Buscar matéria por nome"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-(--muted)"
          />
        </label>
        {user.role === "professor" && (
          query.isSuccess && !limitReached ? (
            <Link href={`/teacher/classrooms/${room.id}/subjects/new`} className={`${actionClass} min-h-12 shrink-0 gap-2`}>
              <Plus size={18} aria-hidden="true" />
              Criar nova matéria
            </Link>
          ) : (
            <button type="button" disabled className={`${actionClass} min-h-12 shrink-0 gap-2`}>
              <Plus size={18} aria-hidden="true" />
              Criar nova matéria
            </button>
          )
        )}
      </div>
      {user.role === "professor" && limitReached && (
        <p role="status" className="text-sm text-(--muted)">
          Limite de 7 matérias por turma atingido.
        </p>
      )}
      {query.isPending && <p role="status">Carregando…</p>}
      <ErrorMessage error={query.error} />
      {query.data && !query.data.length && (
        <EmptyState icon={BookOpen} title="Nenhuma disciplina cadastrada." />
      )}
      {!!query.data?.length && !filteredSubjects?.length && (
        <EmptyState icon={BookOpen} title="Nenhuma matéria encontrada para esta busca." />
      )}
      <ul className="grid gap-5 sm:grid-cols-2">
        {filteredSubjects?.map((subject) => (
          <li key={subject.id} className="min-w-0">
            {user.role === "professor" ? (
              <SubjectCard subject={subject} viewerId={Number(user.id)} />
            ) : (
              <div className="rounded-2xl border border-(--line) bg-white p-6">
                <span
                  aria-hidden="true"
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)"
                >
                  <BookOpen size={24} strokeWidth={1.7} />
                </span>
                <h3 className="break-words text-base font-semibold">
                  {subject.name}
                </h3>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
export function Details({ id, user }: { id: number; user: SessionUser; }) {
  const query = useClassroom(id);
  const manager = user.role === "admin" || user.role === "coordenador";
  if (!Number.isSafeInteger(id) || id < 1)
    return <p role="alert">Identificador de turma inválido.</p>;
  if (query.isPending) return <p role="status">Carregando turma…</p>;
  if (!query.data)
    return (
      <div className="space-y-4">
        <ErrorMessage error={query.error} />
        <button
          type="button"
          onClick={() => query.refetch()}
          className={actionClass}
        >
          Tentar novamente
        </button>
      </div>
    );
  const room = query.data;
  if (user.role === "coordenador")
    return (
      <>
        <ErrorMessage error={query.error} />
        <CoordinatorClassroom
          key={room.id}
          room={room}
          studentsAssignment={<Assignment room={room} resource="students" />}
          teachers={<Assignment room={room} resource="teachers" />}
          edit={<ClassroomForm key={room.id} existing={room} />}
        />
      </>
    );
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-5 border-b border-(--line) pb-8">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)"
        >
          <BookOpen size={29} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          {user.role === "professor" ? (
            <h1 className="page-title break-words">{room.name}</h1>
          ) : (
            <h2 className="text-2xl font-semibold">{room.name}</h2>
          )}
          {user.role !== "professor" && (
            <p className="mt-2 text-sm text-(--muted)">
              Identificador: {room.identifier}
            </p>
          )}
        </div>
        {user.role !== "professor" && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#e8f7fa] px-3 py-2 text-sm font-medium text-(--blue-dark)">
            <Users size={17} aria-hidden="true" />
            {room.teacherIds.length}{" "}
            {room.teacherIds.length === 1
              ? "professor vinculado"
              : "professores vinculados"}
          </span>
        )}
      </div>
      <ErrorMessage error={query.error} />
      <>
        {manager && <ClassroomForm key={room.id} existing={room} />}
        <div className="grid min-w-0 grid-cols-1 gap-8">
          <Subjects room={room} user={user} />
          {user.role !== "aluno" && (
            <div className="space-y-6">
              {manager && (
                <Roster room={room} resource="teachers" manager={manager} />
              )}
              <Roster room={room} resource="students" manager={manager} />
            </div>
          )}
        </div>
      </>
    </div>
  );
}

"use client";
import { StudentList } from "@/components/screens/ClassroomDetails/StudentList";
import { CoordinatorClassroom } from "@/components/screens/ClassroomDetails/CoordinatorClassroom";
import { SubjectCard } from "@/components/screens/ClassroomDetails/SubjectCard";
import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { CoordinatorHome } from "@/components/screens/CoordinatorHome";
import { classroomsApi } from "@/integrations/classrooms/api";
import { useClassroom, useClassrooms } from "@/integrations/classrooms/hooks";
import { MAX_SUBJECTS, subjectsApi } from "@/integrations/subjects/api";
import type { Classroom, CreateClassroom, User } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useUsers } from "@/integrations/users/hooks";
import type { SessionUser, UserRole } from "@/interfaces/auth";
import { homeRoutes } from "@/interfaces/auth";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import {
  ErrorMessage,
  Protected,
  Workspace,
  actionClass,
  fieldClass,
} from "./shared";
import { UsersHome } from "./Users";
const base = (role: UserRole) => homeRoutes[role];
export function ClassroomList({
  user,
  schoolId,
}: {
  user: SessionUser;
  schoolId?: number;
}) {
  const query = useClassrooms();
  const [search, setSearch] = useState("");
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const rooms = query.data?.filter(
    (room) =>
      (schoolId === undefined || room.schoolId === schoolId) &&
      (room.name.toLocaleLowerCase("pt-BR").includes(term) ||
        room.identifier.toLocaleLowerCase("pt-BR").includes(term)),
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
              aria-label="Buscar turmas por nome ou identificador"
              placeholder="Buscar por nome"
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
        <ErrorMessage error={query.error} />
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
                className="choice-card group"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7fa] text-[#0789a5] transition group-hover:bg-[#d9f1f6]">
                  <BookOpen aria-hidden="true" size={29} strokeWidth={1.7} />
                </div>
                <h2 className="text-lg font-semibold leading-7 tracking-tight text-[var(--ink)]">
                  {room.name}
                </h2>

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
                <ChevronRight
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
export function HomePage({ role }: { role: UserRole }) {
  if (role === "coordenador") return <CoordinatorHome />;
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Visão geral">
          <ClassroomList user={user} />
          <UsersHome user={user} />
        </Workspace>
      )}
    </Protected>
  );
}
export function ClassroomsPage({ role }: { role: UserRole }) {
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Turmas">
          <ClassroomList user={user} />
        </Workspace>
      )}
    </Protected>
  );
}
function ClassroomForm({
  existing,
  onCreated,
}: {
  existing?: Classroom;
  onCreated?: (room: Classroom) => void;
}) {
  const [success, setSuccess] = useState(false);
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
    try {
      const room = await mutation.mutateAsync({
        name: String(data.get("name")).trim(),
        ...(!existing ? { identifier: String(data.get("identifier")) } : {}),
      });
      setSuccess(true);
      onCreated?.(room);
    } catch {
      /* Render the server error. */
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6">
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
      <ErrorMessage error={mutation.error} />
      {success && <p role="status">Turma salva.</p>}
      <button disabled={mutation.isPending} className={actionClass}>
        {mutation.isPending ? "Salvando…" : "Salvar turma"}
      </button>
    </form>
  );
}
export function NewClassroomPage({
  role = "coordenador",
}: {
  role?: UserRole;
}) {
  const [created, setCreated] = useState<Classroom | null>(null);
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Criar turma">
          {created ? (
            <Link
              className={actionClass}
              href={base(role) + "/classrooms/" + created.id}
            >
              Turma criada. Vincular alunos e professores
            </Link>
          ) : (
            <ClassroomForm onCreated={setCreated} />
          )}
        </Workspace>
      )}
    </Protected>
  );
}
function Assignment({
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
  const people = useUsers(resource, { q, page, size: 20 });
  const mutation = useApiMutation(async (id: number) =>
    resource === "students"
      ? classroomsApi.enroll(room.id, id)
      : classroomsApi.assign(room.id, id),
  );
  const available =
    people.data?.content.filter((person) =>
      resource === "students"
        ? person.classroomId !== room.id
        : !room.teacherIds.includes(person.id),
    ) || [];
  return (
    <form
      className="space-y-3 rounded-lg bg-slate-50 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!selected || mutation.isPending) return;
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
        aria-label="Buscar pessoa por nome ou RA"
        placeholder="Buscar por nome ou RA"
        value={q}
        onChange={(event) => {
          setQ(event.target.value);
          setPage(0);
          setSelected("");
        }}
      />
      <select
        className={fieldClass}
        aria-label="Selecionar pessoa"
        required
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      >
        <option value="">Selecione</option>
        {available.map((person) => (
          <option key={person.id} value={person.id}>
            {person.fullName} · {person.ra}
            {resource === "students" && person.classroomId
              ? " (transferir de outra turma)"
              : ""}
          </option>
        ))}
      </select>
      {resource === "students" && (
        <p className="text-xs">
          Se o aluno já tiver turma, este vínculo fará a transferência.
        </p>
      )}
      {people.isPending && <p role="status">Carregando…</p>}
      <ErrorMessage error={people.error || mutation.error} />
      {success && <p role="status">Vínculo salvo.</p>}
      <div className="flex gap-3">
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
          disabled={!people.data || page + 1 >= people.data.totalPages}
          onClick={() => {
            setPage(page + 1);
            setSelected("");
          }}
        >
          Próxima
        </button>
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
                ? (person) => {
                    if (
                      window.confirm(
                        "Desvincular " + person.fullName + " desta turma?",
                      )
                    )
                      mutation.mutate(person);
                  }
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
                      if (
                        window.confirm(
                          "Desvincular " + person.fullName + " desta turma?",
                        )
                      )
                        mutation.mutate(person);
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
    </section>
  );
}
function Subjects({ room, user }: { room: Classroom; user: SessionUser }) {
  const query = useQuery({
    queryKey: ["subjects", room.id],
    queryFn: ({ signal }) => subjectsApi.list(room.id, signal),
  });
  const mutation = useApiMutation((name: string) =>
    subjectsApi.create(room.id, name),
  );
  const limitReached = (query.data?.length ?? 0) >= MAX_SUBJECTS;
  return (
    <section className="min-w-0 space-y-6" aria-label="Disciplinas">
      <div>
        <h2 className="text-xl font-semibold">Disciplinas</h2>
        <p className="mt-2 text-sm leading-6 text-(--muted)">
          Conteúdos organizados por disciplina nesta turma.
        </p>
      </div>
      {user.role === "professor" && (
        <form
          className="flex w-full flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={async (event) => {
            event.preventDefault();
            if (mutation.isPending || limitReached || !query.isSuccess) return;
            const form = event.currentTarget;
            const data = new FormData(form);
            try {
              const name = String(data.get("name")).trim();
              if (!name) return;
              await mutation.mutateAsync(name);
              form.reset();
            } catch {
              /* Render below. */
            }
          }}
        >
          <label className="min-w-0 flex-1 text-sm font-medium">
            Nome da disciplina
            <input
              name="name"
              aria-label="Nome da disciplina"
              placeholder="Nome da disciplina"
              required
              pattern=".*\S.*"
              maxLength={100}
              disabled={mutation.isPending || limitReached || !query.isSuccess}
              className={fieldClass}
            />
          </label>
          <button
            className={`${actionClass} min-h-12 shrink-0`}
            disabled={mutation.isPending || limitReached || !query.isSuccess}
          >
            {mutation.isPending ? "Criando…" : "Criar disciplina"}
          </button>
        </form>
      )}
      {user.role === "professor" && limitReached && (
        <p role="status" className="text-sm text-(--muted)">
          Limite de 7 matérias por turma atingido.
        </p>
      )}
      {query.isPending && <p role="status">Carregando…</p>}
      <ErrorMessage error={query.error || mutation.error} />
      {query.data && !query.data.length && (
        <EmptyState icon={BookOpen} title="Nenhuma disciplina cadastrada." />
      )}
      <ul className="grid gap-5 sm:grid-cols-2">
        {query.data?.map((subject) => (
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
function Details({ id, user }: { id: number; user: SessionUser }) {
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
export function ClassroomDetailsPage({
  id,
  role,
}: {
  id: string;
  role: UserRole;
}) {
  return (
    <Protected role={role}>
      {(user) =>
        user.role === "professor" ? (
          <TeacherShell user={user}>
            <Details id={Number(id)} user={user} />
          </TeacherShell>
        ) : (
          <Workspace
            user={user}
            title="Detalhes da turma"
            description="Acompanhe e organize os alunos, professores e matérias da turma."
          >
            <Details id={Number(id)} user={user} />
          </Workspace>
        )
      }
    </Protected>
  );
}

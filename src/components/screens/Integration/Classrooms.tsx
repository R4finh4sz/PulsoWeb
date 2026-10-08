"use client";
import { StatCard } from "@/components/ui/StatCard";
import { classroomsApi } from "@/integrations/classrooms/api";
import { useClassroom, useClassrooms } from "@/integrations/classrooms/hooks";
import { subjectsApi } from "@/integrations/subjects/api";
import type { Classroom, CreateClassroom, User } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useUsers } from "@/integrations/users/hooks";
import type { SessionUser, UserRole } from "@/interfaces/auth";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { ErrorMessage, Protected, Workspace, actionClass, fieldClass } from "./shared";
import { UsersHome } from "./Users";
import { homeRoutes } from "@/interfaces/auth";
const base = (role: UserRole) => homeRoutes[role];
export function ClassroomList({ user }: { user: SessionUser }) {
  const query = useClassrooms();
  const [search, setSearch] = useState("");
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const rooms = query.data?.filter(room =>
    room.name.toLocaleLowerCase("pt-BR").includes(term)
    || room.identifier.toLocaleLowerCase("pt-BR").includes(term)
  );
  return <section className="space-y-4 rounded-xl bg-white p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Turmas cadastradas</h2>
      {(user.role === "coordenador" || user.role === "admin") && <Link className={actionClass} href={base(user.role) + "/classrooms/new"}>Criar turma</Link>}
    </div>
    <div className="overflow-hidden rounded-xl border border-(--line) bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-(--line) p-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-(--line) bg-[var(--paper)] px-3 py-2 focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-(--muted)" />
          <input type="search" aria-label="Buscar turmas por nome ou identificador" placeholder="Buscar por nome ou identificador" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-(--muted)" />
        </label>
        <span role="status" className="text-xs font-medium text-(--muted)">{query.data ? `${rooms?.length ?? 0} ${(rooms?.length ?? 0) === 1 ? "turma" : "turmas"}` : "-- turmas"}</span>
      </div>
      {query.isPending && <p role="status" className="p-4 text-sm text-(--muted)">Carregando turmas…</p>}
      {query.error && <div className="p-3"><ErrorMessage error={query.error} /></div>}
      {query.data && !rooms?.length && <p className="p-6 text-center text-sm text-(--muted)">{term ? "Nenhuma turma encontrada para esta busca." : "Nenhuma turma disponível."}</p>}
      <ul className="divide-y divide-[var(--line)]">
        {rooms?.map(room => <li key={room.id}>
          <Link href={base(user.role) + "/classrooms/" + room.id} className="flex flex-wrap items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--blue)] sm:flex-nowrap">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1f5f8] text-(--blue)"><BookOpen className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-[var(--ink)]">{room.name} · {room.identifier}</h3>
              <p className="text-xs text-(--muted)">{room.teacherIds.length} {room.teacherIds.length === 1 ? "professor vinculado" : "professores vinculados"}</p>
            </div>
            <ChevronRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-(--muted) sm:ml-0" />
          </Link>
        </li>)}
      </ul>
    </div>
  </section>;
}
function CoordinatorDashboard() {
  const teachers = useUsers("teachers", { page: 0, size: 1 });
  const students = useUsers("students", { page: 0, size: 1 });
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard label="Professores criados" value={teachers.data?.totalElements ?? "--"} detail="Cadastros disponíveis" icon="users" />
    <StatCard label="Quizzes criados" value="--" detail="Integração pendente" icon="help" />
    <StatCard label="Quizzes respondidos" value="--" detail="Integração pendente" icon="chart" />
    <StatCard label="Alunos cadastrados" value={students.data?.totalElements ?? "--"} detail="Cadastros disponíveis" icon="users" />
  </div>;
}
export function HomePage({ role }: { role: UserRole }) {
  return <Protected role={role}>{user => <Workspace user={user} title="Visão geral">
    {user.role === "coordenador" && <CoordinatorDashboard />}<ClassroomList user={user} /><UsersHome user={user} />
  </Workspace>}</Protected>;
}
export function ClassroomsPage({ role }: { role: UserRole }) {
  return <Protected role={role}>{user => <Workspace user={user} title="Turmas"><ClassroomList user={user} /></Workspace>}</Protected>;
}
function ClassroomForm({ existing, onCreated }: { existing?: Classroom; onCreated?: (room: Classroom) => void }) {
  const [success, setSuccess] = useState(false);
  const mutation = useApiMutation((body: CreateClassroom) => existing ? classroomsApi.update(existing.id, body) : classroomsApi.create(body));
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); if (mutation.isPending) return;
    const form = event.currentTarget; const data = new FormData(form); setSuccess(false);
    try {
      const room = await mutation.mutateAsync({ name: String(data.get("name")).trim(), identifier: String(data.get("identifier")) });
      setSuccess(true); onCreated?.(room);
    } catch { /* Render the server error. */ }
  }
  return <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6">
    <label className="block text-sm">Nome da turma<input name="name" maxLength={100} required defaultValue={existing?.name} placeholder="3º ano" className={fieldClass} /></label>
    <label className="block text-sm">Identificador<input name="identifier" pattern="[A-Z]" maxLength={1} required defaultValue={existing?.identifier} placeholder="A" title="Uma letra maiúscula de A a Z" className={fieldClass} /></label>
    <ErrorMessage error={mutation.error} />{success && <p role="status">Turma salva.</p>}
    <button disabled={mutation.isPending} className={actionClass}>{mutation.isPending ? "Salvando…" : "Salvar turma"}</button>
  </form>;
}
export function NewClassroomPage({ role = "coordenador" }: { role?: UserRole }) {
  const [created, setCreated] = useState<Classroom | null>(null);
  return <Protected role={role}>{user => <Workspace user={user} title="Criar turma">
    {created ? <Link className={actionClass} href={base(role) + "/classrooms/" + created.id}>Turma criada. Vincular alunos e professores</Link> : <ClassroomForm onCreated={setCreated} />}
  </Workspace>}</Protected>;
}
function Assignment({ room, resource }: { room: Classroom; resource: "students" | "teachers" }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(0); const [selected, setSelected] = useState("");
  const [success, setSuccess] = useState(false);
  const people = useUsers(resource, { q, page, size: 20 });
  const mutation = useApiMutation(async (id: number) => resource === "students" ? classroomsApi.enroll(room.id, id) : classroomsApi.assign(room.id, id));
  const available = people.data?.content.filter(person => resource === "students" ? person.classroomId !== room.id : !room.teacherIds.includes(person.id)) || [];
  return <form className="space-y-3 rounded-lg bg-slate-50 p-4" onSubmit={async event => {
    event.preventDefault(); if (!selected || mutation.isPending) return; setSuccess(false);
    try { await mutation.mutateAsync(Number(selected)); setSelected(""); setSuccess(true); } catch { /* Render below. */ }
  }}>
    <h3 className="text-sm font-semibold">{resource === "students" ? "Vincular aluno" : "Vincular professor"}</h3>
    <input className={fieldClass} aria-label="Buscar pessoa por nome ou RA" placeholder="Buscar por nome ou RA" value={q}
      onChange={event => { setQ(event.target.value); setPage(0); setSelected(""); }} />
    <select className={fieldClass} aria-label="Selecionar pessoa" required value={selected} onChange={event => setSelected(event.target.value)}>
      <option value="">Selecione</option>{available.map(person => <option key={person.id} value={person.id}>{person.fullName} · {person.ra}{resource === "students" && person.classroomId ? " (transferir de outra turma)" : ""}</option>)}
    </select>
    {resource === "students" && <p className="text-xs">Se o aluno já tiver turma, este vínculo fará a transferência.</p>}
    {people.isPending && <p role="status">Carregando…</p>}<ErrorMessage error={people.error || mutation.error} />
    {success && <p role="status">Vínculo salvo.</p>}
    <div className="flex gap-3">
      <button type="button" disabled={page === 0} onClick={() => { setPage(page - 1); setSelected(""); }}>Anterior</button>
      <button type="button" disabled={!people.data || page + 1 >= people.data.totalPages} onClick={() => { setPage(page + 1); setSelected(""); }}>Próxima</button>
      <button className={actionClass} disabled={!selected || mutation.isPending}>{mutation.isPending ? "Vinculando…" : "Vincular"}</button>
    </div>
  </form>;
}
function Roster({ room, resource, manager }: { room: Classroom; resource: "students" | "teachers"; manager: boolean }) {
  const query = useQuery({
    queryKey: ["classrooms", room.id, resource],
    queryFn: ({ signal }) => resource === "students" ? classroomsApi.students(room.id, signal) : classroomsApi.teachers(room.id, signal)
  });
  const mutation = useApiMutation((person: User) => resource === "students" ? classroomsApi.unenroll(room.id, person.id) : classroomsApi.unassign(room.id, person.id));
  return <section className="space-y-4 rounded-xl bg-white p-6">
    <h2 className="text-lg font-semibold">{resource === "students" ? "Alunos" : "Professores"} vinculados</h2>
    {manager && <Assignment room={room} resource={resource} />}
    {query.isPending && <p role="status">Carregando…</p>}<ErrorMessage error={query.error || mutation.error} />
    {query.data && !query.data.length && <p>Nenhum vínculo cadastrado.</p>}
    <ul className="space-y-3">{query.data?.map(person => <li key={person.id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-(--line) p-4">
      <div><p>{person.fullName}</p><p className="break-all text-sm">{person.email} · {person.ra}</p></div>
      {manager && <button disabled={mutation.isPending} onClick={() => {
        if (window.confirm("Desvincular " + person.fullName + " desta turma?")) mutation.mutate(person);
      }} className="text-sm text-red-700">Desvincular</button>}
    </li>)}</ul>
  </section>;
}
function Subjects({ room, user }: { room: Classroom; user: SessionUser }) {
  const query = useQuery({ queryKey: ["subjects", room.id], queryFn: ({ signal }) => subjectsApi.list(room.id, signal) });
  const mutation = useApiMutation((name: string) => subjectsApi.create(room.id, name));
  return <section className="space-y-4 rounded-xl bg-white p-6">
    <h2 className="text-lg font-semibold">Disciplinas</h2>
    {user.role === "professor" && <form className="flex gap-3" onSubmit={async event => {
      event.preventDefault(); if (mutation.isPending) return;
      const form = event.currentTarget; const data = new FormData(form);
      try { await mutation.mutateAsync(String(data.get("name")).trim()); form.reset(); } catch { /* Render below. */ }
    }}><input name="name" aria-label="Nome da disciplina" placeholder="Nome da disciplina" required maxLength={100} className={fieldClass} />
      <button className={actionClass} disabled={mutation.isPending}>Criar disciplina</button></form>}
    {query.isPending && <p role="status">Carregando…</p>}<ErrorMessage error={query.error || mutation.error} />
    {query.data && !query.data.length && <p>Nenhuma disciplina cadastrada.</p>}
    <ul className="grid gap-4 sm:grid-cols-2">{query.data?.map(subject => <li key={subject.id} className="rounded-lg border border-(--line) p-4">{subject.name}</li>)}</ul>
  </section>;
}
function Details({ id, user }: { id: number; user: SessionUser }) {
  const query = useClassroom(id);
  const manager = user.role === "admin" || user.role === "coordenador";
  if (!Number.isSafeInteger(id) || id < 1) return <p role="alert">Identificador de turma inválido.</p>;
  if (query.isPending) return <p role="status">Carregando turma…</p>;
  if (!query.data) return <ErrorMessage error={query.error} />;
  const room = query.data;
  return <div className="space-y-6"><h2 className="text-xl font-semibold">{room.name} · {room.identifier}</h2>
    <ErrorMessage error={query.error} />{manager && <ClassroomForm key={room.id} existing={room} />}
    {user.role !== "aluno" && <><Roster room={room} resource="teachers" manager={manager} /><Roster room={room} resource="students" manager={manager} /></>}
    <Subjects room={room} user={user} />
  </div>;
}
export function ClassroomDetailsPage({ id, role }: { id: string; role: UserRole }) {
  return <Protected role={role}>{user => <Workspace user={user} title="Detalhes da turma"><Details id={Number(id)} user={user} /></Workspace>}</Protected>;
}

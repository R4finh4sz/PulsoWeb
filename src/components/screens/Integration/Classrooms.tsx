"use client";
import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClassrooms, useClassroom } from "@/integrations/classrooms/hooks";
import { classroomsApi } from "@/integrations/classrooms/api";
import { subjectsApi } from "@/integrations/subjects/api";
import { useUsers } from "@/integrations/users/hooks";
import { useApiMutation } from "@/integrations/useApiMutation";
import type { Classroom, CreateClassroom, User } from "@/integrations/types";
import type { SessionUser, UserRole } from "@/interfaces/auth";
import { Protected, Workspace, ErrorMessage, actionClass, fieldClass } from "./shared";
import { UsersHome } from "./Users";
import { StatCard } from "@/components/ui/StatCard";
const base = (role: UserRole) => "/" + role;
export function ClassroomList({ user }: { user: SessionUser }) {
  const query = useClassrooms();
  return <section className="space-y-4 rounded-xl bg-white p-6">
    <h2 className="text-lg font-semibold">Turmas</h2>
    {(user.role === "coordenador" || user.role === "admin") && <div className="pt-1"><Link className={actionClass} href={base(user.role) + "/turmas/nova"}>Criar turma</Link></div>}
    {query.isPending && <p role="status">Carregando turmas…</p>}<ErrorMessage error={query.error} />
    {query.data && !query.data.length && <p className="mt-2">Nenhuma turma disponível.</p>}
    <div className="grid gap-4 pt-2 md:grid-cols-2 xl:grid-cols-3">{query.data?.map(room => <Link key={room.id}
      href={base(user.role) + "/turmas/" + room.id} className="rounded-xl border border-[var(--line)] p-5 hover:border-[var(--blue)]">
      <h3 className="font-semibold">{room.name} · {room.identifier}</h3><p className="mt-2 text-sm">{room.teacherIds.length} professores vinculados</p>
    </Link>)}</div>
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
    {created ? <Link className={actionClass} href={base(role) + "/turmas/" + created.id}>Turma criada. Vincular alunos e professores</Link> : <ClassroomForm onCreated={setCreated} />}
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
  const query = useQuery({ queryKey: ["classrooms", room.id, resource],
    queryFn: ({ signal }) => resource === "students" ? classroomsApi.students(room.id, signal) : classroomsApi.teachers(room.id, signal) });
  const mutation = useApiMutation((person: User) => resource === "students" ? classroomsApi.unenroll(room.id, person.id) : classroomsApi.unassign(room.id, person.id));
  return <section className="space-y-4 rounded-xl bg-white p-6">
    <h2 className="text-lg font-semibold">{resource === "students" ? "Alunos" : "Professores"} vinculados</h2>
    {manager && <Assignment room={room} resource={resource} />}
    {query.isPending && <p role="status">Carregando…</p>}<ErrorMessage error={query.error || mutation.error} />
    {query.data && !query.data.length && <p>Nenhum vínculo cadastrado.</p>}
    <ul className="space-y-3">{query.data?.map(person => <li key={person.id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-[var(--line)] p-4">
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
    <ul className="grid gap-4 sm:grid-cols-2">{query.data?.map(subject => <li key={subject.id} className="rounded-lg border border-[var(--line)] p-4">{subject.name}</li>)}</ul>
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

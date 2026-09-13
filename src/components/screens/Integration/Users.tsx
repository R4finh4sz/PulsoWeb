"use client";
import { useState, type FormEvent } from "react";
import { useUsers } from "@/integrations/users/hooks";
import { usersApi } from "@/integrations/users/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import type { CreateUser, User, UserResource } from "@/integrations/types";
import type { SessionUser, UserRole } from "@/interfaces/auth";
import { Protected, Workspace, ErrorMessage, fieldClass, actionClass } from "./shared";
const labels = { students: "Alunos", teachers: "Professores", coordinators: "Coordenadores" };
export function UserForm({ resource, existing, onDone }: { resource: UserResource; existing?: User; onDone?: () => void }) {
  const [success, setSuccess] = useState(false);
  const mutation = useApiMutation((body: CreateUser) => existing && resource !== "coordinators"
    ? usersApi.update(resource, existing.id, body) : usersApi.create(resource, body));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (mutation.isPending) return;
    const form = event.currentTarget; const data = new FormData(form); setSuccess(false);
    try {
      await mutation.mutateAsync({ fullName: String(data.get("fullName")).trim(), ra: String(data.get("ra")).trim(), email: String(data.get("email")).trim() });
      setSuccess(true); if (!existing) form.reset(); onDone?.();
    } catch { /* Error is rendered below. */ }
  }
  return <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-[var(--line)] bg-white p-6">
    <label className="block text-sm">Nome completo<input name="fullName" required maxLength={100} defaultValue={existing?.fullName} className={fieldClass} /></label>
    <label className="block text-sm">RA / matrícula<input name="ra" required maxLength={50} defaultValue={existing?.ra} className={fieldClass} /></label>
    <label className="block text-sm">E-mail<input name="email" type="email" required maxLength={50} defaultValue={existing?.email} className={fieldClass} /></label>
    {!existing && <p className="text-sm text-[var(--muted)]">A senha de acesso será enviada para este e-mail.</p>}
    <ErrorMessage error={mutation.error} />
    {success && <p role="status" className="text-sm text-green-700">Cadastro salvo com sucesso.</p>}
    <button disabled={mutation.isPending} className={actionClass}>{mutation.isPending ? "Salvando…" : "Salvar"}</button>
  </form>;
}
export function UserList({ resource }: { resource: UserResource }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(0);
  const [unassigned, setUnassigned] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const query = useUsers(resource, { q, page, size: 20, unassigned: resource === "students" && unassigned ? true : undefined });
  return <section id={resource} className="space-y-4 rounded-xl bg-white p-6">
    <h2 className="text-lg font-semibold">{labels[resource]}</h2>
    <input aria-label="Buscar por nome ou RA" placeholder="Buscar por nome ou RA" value={q} onChange={event => { setQ(event.target.value); setPage(0); }} className={fieldClass} />
    {resource === "students" && <label className="flex gap-2 text-sm"><input type="checkbox" checked={unassigned} onChange={event => { setUnassigned(event.target.checked); setPage(0); }} />Somente alunos sem turma</label>}
    {query.isPending && <p role="status">Carregando…</p>}<ErrorMessage error={query.error} />
    {query.data && <>
      <p className="text-sm">{query.data.totalElements} cadastros</p>
      {!query.data.content.length && <p>Nenhum cadastro encontrado.</p>}
      <div className="grid gap-4 md:grid-cols-2">{query.data.content.map(person => <article key={person.id} className="rounded-lg border border-[var(--line)] p-4">
        <h3 className="font-semibold">{person.fullName}</h3><p className="break-all text-sm">{person.email}</p><p className="text-sm">RA: {person.ra}</p>
        {resource !== "coordinators" && <button className="mt-3 text-sm text-[var(--blue)]" onClick={() => setEditing(person)}>Editar cadastro</button>}
      </article>)}</div>
      <div className="flex items-center gap-4">
        <button className={actionClass} disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page + 1} de {Math.max(query.data.totalPages, 1)}</span>
        <button className={actionClass} disabled={page + 1 >= query.data.totalPages} onClick={() => setPage(page + 1)}>Próxima</button>
      </div>
    </>}
    {editing && <div><button onClick={() => setEditing(null)}>Cancelar edição</button><UserForm key={editing.id} resource={resource} existing={editing} onDone={() => setEditing(null)} /></div>}
  </section>;
}
export function NewUserPage({ resource, role }: { resource: UserResource; role: UserRole }) {
  return <Protected role={role}>{user => <Workspace user={user} title={"Cadastrar · " + labels[resource]}><UserForm resource={resource} /></Workspace>}</Protected>;
}
export function TeachersPage() {
  return <Protected role="coordenador">{user => <Workspace user={user} title="Professores">
    <a className={actionClass} href="/coordenador/professores/novo">Criar professor</a><UserList resource="teachers" />
  </Workspace>}</Protected>;
}
export function UsersHome({ user }: { user: SessionUser }) {
  return user.role === "admin" ? <UserList resource="coordinators" /> : user.role === "coordenador" ? <UserList resource="students" /> : null;
}

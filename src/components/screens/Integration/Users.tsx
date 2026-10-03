"use client";
import { useSchools } from "@/integrations/schools/hooks";
import type { CreateUser, User, UserResource } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { usersApi } from "@/integrations/users/api";
import { useUsers } from "@/integrations/users/hooks";
import type { SessionUser, UserRole } from "@/interfaces/auth";
import { useFeedbackStore } from "@/store/feedbackStore";
import { formatCnpj } from "@/utils/cnpj";
import { findAddressByCep, formatCep, type ViaCepAddress } from "@/utils/viacep";
import { Pencil, Search } from "lucide-react";
import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import { actionClass, EmptyState, ErrorMessage, fieldClass, Protected, Workspace } from "./shared";
const labels = { students: "Alunos", teachers: "Professores", coordinators: "Coordenadores" };
function normalizeAddress(value: string | undefined) { return value?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || ""; }
export function UserForm({ resource, existing, onDone }: { resource: UserResource; existing?: User; onDone?: () => void }) {
  const showFeedback = useFeedbackStore((state) => state.showFeedback);
  const schools = useSchools(resource === "coordinators");
  const [schoolCnpj, setSchoolCnpj] = useState("");
  const [schoolCep, setSchoolCep] = useState("");
  const [schoolAddress, setSchoolAddress] = useState<ViaCepAddress | null>(null);
  const [schoolCepStatus, setSchoolCepStatus] = useState<"idle" | "loading" | "not-found">("idle");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const mutation = useApiMutation((body: CreateUser) => existing && resource !== "coordinators"
    ? usersApi.update(resource, existing.id, body) : usersApi.create(resource, body));
  const filteredSchools = schools.data?.filter(school => {
    const cnpj = schoolCnpj.replace(/\D/g, "");
    if (cnpj && !school.cnpj.replace(/\D/g, "").includes(cnpj)) return false;
    if (!schoolAddress) return true;
    return [[schoolAddress.logradouro, school.logradouro], [schoolAddress.bairro, school.bairro], [schoolAddress.localidade, school.cidade]]
      .filter(([addressValue]) => addressValue)
      .every(([addressValue, schoolValue]) => {
        const address = normalizeAddress(addressValue);
        const school = normalizeAddress(schoolValue);
        return school === address || school.includes(address) || address.includes(school);
      });
  });
  async function searchSchoolByCep(event: ChangeEvent<HTMLInputElement>) {
    const formatted = formatCep(event.target.value);
    setSchoolCep(formatted);
    setSelectedSchoolId("");
    setSchoolAddress(null);
    if (formatted.replace(/\D/g, "").length !== 8) { setSchoolCepStatus("idle"); return; }
    setSchoolCepStatus("loading");
    try {
      const address = await findAddressByCep(formatted.replace(/\D/g, ""));
      setSchoolAddress(address);
      setSchoolCepStatus(address ? "idle" : "not-found");
    } catch { setSchoolCepStatus("not-found"); }
  }
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); if (mutation.isPending) return;
    const form = event.currentTarget; const data = new FormData(form);
    const schoolId = resource === "coordinators" ? Number(selectedSchoolId || data.get("schoolId")) : undefined;
    if (resource === "coordinators" && (schoolId === undefined || !Number.isSafeInteger(schoolId) || schoolId < 1)) {
      showFeedback({ type: "error", message: "Selecione uma escola para vincular o coordenador." });
      return;
    }
    try {
      await mutation.mutateAsync({
        fullName: String(data.get("fullName")).trim(),
        ra: String(data.get("ra")).trim(),
        email: String(data.get("email")).trim(),
        schoolId,
      });
      if (!existing) form.reset();
      onDone?.();
    } catch {  }
  }
  return <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-(--line) bg-white p-6">
    <label className="block text-sm">Nome completo<input name="fullName" required maxLength={100} defaultValue={existing?.fullName} className={fieldClass} /></label>
    <label className="block text-sm">RA / matrícula<input name="ra" required maxLength={50} defaultValue={existing?.ra} className={fieldClass} /></label>
    <label className="block text-sm">E-mail<input name="email" type="email" required maxLength={50} defaultValue={existing?.email} className={fieldClass} /></label>
    {resource === "coordinators" && <div className="space-y-3"><label className="block text-sm">Buscar escola por CNPJ<input name="schoolCnpj" value={schoolCnpj} onChange={event => { setSchoolCnpj(formatCnpj(event.target.value)); setSelectedSchoolId(""); }} inputMode="numeric" maxLength={18} placeholder="00.000.000/0000-00" className={fieldClass} /></label><label className="block text-sm">Buscar escola por CEP<input name="schoolCep" value={schoolCep} onChange={searchSchoolByCep} inputMode="numeric" maxLength={9} placeholder="00000-000" className={fieldClass} /></label>{schoolCepStatus === "loading" && <p className="text-xs text-(--muted)">Buscando endereço…</p>}{schoolCepStatus === "not-found" && <p className="text-xs text-(--muted)">CEP não encontrado. Selecione a escola manualmente.</p>}<label className="block text-sm">Escola<select name="schoolId" required className={fieldClass} value={selectedSchoolId} onChange={event => setSelectedSchoolId(event.target.value)}><option value="">Selecione a escola</option>{filteredSchools?.map(school => <option key={school.id} value={school.id}>{school.nome}</option>)}</select>{schools.isPending && <span className="mt-1 block text-xs text-(--muted)">Carregando escolas…</span>}{(schoolAddress || schoolCnpj) && !filteredSchools?.length && <span className="mt-1 block text-xs text-(--muted)">Nenhuma escola encontrada para a busca.</span>}<ErrorMessage error={schools.error} /></label></div>}
    {!existing && <p className="text-sm text-(--muted)">A senha de acesso será enviada para este e-mail.</p>}
    <button disabled={mutation.isPending} className={actionClass}>{mutation.isPending ? "Salvando…" : "Salvar"}</button>
  </form>;
}
export function UserList({ resource }: { resource: UserResource }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(0);
  const [unassigned, setUnassigned] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const query = useUsers(resource, { q, page, size: 10, unassigned: resource === "students" && unassigned ? true : undefined });
  return <section id={resource} className="space-y-4 rounded-xl bg-white p-6">
    <h2 className="text-lg font-semibold">{labels[resource]}</h2>
    {resource === "students" && <label className="flex gap-2 text-sm"><input type="checkbox" checked={unassigned} onChange={event => { setUnassigned(event.target.checked); setPage(0); }} />Somente alunos sem turma</label>}
    <div className="overflow-hidden rounded-xl border border-(--line) bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-(--line) p-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-(--line) bg-[var(--paper)] px-3 py-2 focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-(--muted)" />
          <input type="search" aria-label="Buscar por nome ou RA" placeholder="Buscar por nome ou RA" value={q} onChange={event => { setQ(event.target.value); setPage(0); }} className="min-w-0 w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-(--muted)" />
        </label>
        <span role="status" className="text-xs font-medium text-(--muted)">{query.data ? `${query.data.totalElements} ${query.data.totalElements === 1 ? "cadastro" : "cadastros"}` : "-- cadastros"}</span>
      </div>
      {query.isPending && <p role="status" className="p-4 text-sm text-(--muted)">Carregando…</p>}
      {query.error && <div className="p-3"><ErrorMessage error={query.error} /></div>}
      {query.data && !query.data.content.length && (q.trim() ? <p className="p-6 text-center text-sm text-(--muted)">Nenhum cadastro encontrado para esta busca.</p> : <EmptyState />)}
      <ul className="divide-y divide-[var(--line)]">{query.data?.content.map(person => <li key={person.id} className="flex flex-wrap items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--paper)] sm:flex-nowrap">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1f5f8] text-xs font-semibold text-(--blue)">{person.fullName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toLocaleUpperCase("pt-BR")}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-(--ink)">{person.fullName}</h3>
          <p className="break-all text-xs text-(--muted)">{person.email} · RA: {person.ra || "Não informado"}</p>
        </div>
        {resource !== "coordinators" && <button className="ml-12 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-(--blue) hover:bg-[#e1f5f8] focus-visible:outline-2 focus-visible:outline-[var(--blue)] sm:ml-0" aria-label={`Editar cadastro de ${person.fullName}`} onClick={() => setEditing(person)}><Pencil aria-hidden="true" className="h-3.5 w-3.5" />Editar cadastro</button>}
      </li>)}</ul>
    </div>
    {query.data && query.data.totalElements >= 10 && <>
      <div className="flex flex-wrap items-center gap-4">
        <button className={actionClass} disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page + 1} de {query.data.totalPages}</span>
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
    <div className="mb-6"><a className={actionClass} href="/coordinator/teachers/new">Convidar professor</a></div><UserList resource="teachers" />
  </Workspace>}</Protected>;
}
export function UsersHome({ user }: { user: SessionUser }) {
  return user.role === "admin" ? <UserList resource="coordinators" /> : user.role === "coordenador" ? <UserList resource="students" /> : null;
}

export function CoordinatorsPage() {
  return <Protected role="admin">{user => <Workspace user={user} title="Coordenadores">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-(--muted)">Gerencie os coordenadores cadastrados na plataforma.</p>
      <a className={actionClass} href="/admin/coordenadores/novo">Convidar coordenador</a>
    </div>
    <UserList resource="coordinators" />
  </Workspace>}</Protected>;
}

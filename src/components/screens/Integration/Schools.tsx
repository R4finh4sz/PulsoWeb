"use client";

import { StatCard } from "@/components/ui/StatCard";
import { useSchools } from "@/integrations/schools/hooks";
import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorMessage, Protected, Workspace, actionClass } from "./shared";

export function SchoolsPage() {
  const query = useSchools();
  const [search, setSearch] = useState("");
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const cnpjTerm = term.replace(/\D/g, "");
  const schools = query.data?.filter(school =>
    school.nome.toLocaleLowerCase("pt-BR").includes(term)
    || school.cnpj?.toLocaleLowerCase("pt-BR").includes(term)
    || (cnpjTerm.length > 0 && school.cnpj?.replace(/\D/g, "").includes(cnpjTerm))
  );
  return <Protected role="admin">{user => <Workspace user={user} title="Escolas">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Escolas cadastradas" value={query.data?.length ?? "--"} icon="school" />
      <StatCard label="Coordenadores vinculados" value={query.data?.filter(school => school.coordinator).length ?? "--"} icon="users" />
      <StatCard label="Alunos cadastrados" value="--"  icon="users" />
      <StatCard label="Professores cadastrados" value="--"  icon="users" />
    </div>
    <section className="space-y-4 rounded-xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Escolas cadastradas</h2>
        <Link className={actionClass} href="/admin/schools/new">Criar escola</Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-(--line) bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-(--line) p-3">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-(--line) bg-[var(--paper)] px-3 py-2 focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-(--muted)" />
            <input type="search" aria-label="Buscar escolas por nome ou CNPJ" placeholder="Buscar por nome ou CNPJ" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-(--muted)" />
          </label>
          <span role="status" className="text-xs font-medium text-(--muted)">{query.data ? `${schools?.length ?? 0} ${(schools?.length ?? 0) === 1 ? "escola" : "escolas"}` : "-- escolas"}</span>
        </div>
        {query.isPending && <p role="status" className="p-4 text-sm text-(--muted)">Carregando escolas…</p>}
        {query.error && <div className="p-3"><ErrorMessage error={query.error} /></div>}
        {query.data && !query.data.length && <EmptyState />}
        {query.data && query.data.length > 0 && !schools?.length && <p className="p-6 text-center text-sm text-(--muted)">Nenhuma escola encontrada para esta busca.</p>}
        <ul className="divide-y divide-[var(--line)]">
          {schools?.map(school => <li key={school.id}>
            <Link href={`/admin/schools/${school.id}`} className="flex flex-wrap items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--blue)] sm:flex-nowrap">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1f5f8] text-xs font-semibold text-(--blue)">{school.nome.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toLocaleUpperCase("pt-BR")}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-[var(--ink)]">{school.nome}</h3>
                <p className="text-xs text-(--muted)">{school.cidade || "Cidade não informada"} · CNPJ {school.cnpj || "Não informado"}</p>
              </div>
              <span className={`ml-12 rounded-full px-2.5 py-1 text-[10px] font-medium sm:ml-0 ${school.coordinator ? "bg-[#ddf8e8] text-[#18864b]" : "bg-[#fff2c9] text-[#9a7100]"}`}>{school.coordinator?.fullName || "Coordenação não informada"}</span>
              <ChevronRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-(--muted) sm:ml-0" />
            </Link>
          </li>)}
        </ul>
      </div>
    </section>
  </Workspace>}</Protected>;
}

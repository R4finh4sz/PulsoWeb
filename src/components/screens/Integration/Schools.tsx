"use client";

import Link from "next/link";
import { useSchools } from "@/integrations/schools/hooks";
import { Protected, Workspace, ErrorMessage, EmptyState, actionClass } from "./shared";
import { StatCard } from "@/components/ui/StatCard";

export function SchoolsPage() {
  const query = useSchools();
  return <Protected role="admin">{user => <Workspace user={user} title="Escolas">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Escolas cadastradas" value={query.data?.length ?? "--"} detail="Registros disponíveis na API" icon="school" />
      <StatCard label="Coordenadores vinculados" value="--" detail="Integração pendente" icon="users" />
      <StatCard label="Alunos cadastrados" value="--" detail="Integração pendente" icon="users" />
      <StatCard label="Professores cadastrados" value="--" detail="Integração pendente" icon="users" />
    </div>
    <section className="space-y-4 rounded-xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Escolas cadastradas</h2>
        <Link className={actionClass} href="/admin/escolas/nova">Criar escola</Link>
      </div>
      {query.isPending && <p role="status">Carregando escolas…</p>}
      <ErrorMessage error={query.error} />
      {query.data && !query.data.length && <EmptyState />}
      <div className="grid gap-4 md:grid-cols-2">
        {query.data?.map(school => <article key={school.id} className="rounded-lg border border-[var(--line)] p-4">
          <h3 className="font-semibold">{school.nome}</h3>
          <p className="mt-1 text-sm">CNPJ: {school.cnpj || "--"}</p>
          <p className="mt-1 text-sm">{school.logradouro || "--"}, {school.bairro || "--"}</p>
          <p className="mt-1 text-sm">{school.cidade || "--"}</p>
          <p className="mt-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">Coordenação: --</p>
        </article>)}
      </div>
    </section>
  </Workspace>}</Protected>;
}
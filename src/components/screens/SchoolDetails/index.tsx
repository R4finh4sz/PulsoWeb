"use client";

import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useSchools } from "@/integrations/schools/hooks";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function SchoolDetails({ id }: { id: string }) {
  const user = useSession("admin");
  const query = useSchools();
  if (!user) return <p role="status" className="p-8 text-sm">Carregando escola…</p>;
  const school = query.data?.find((item) => String(item.id) === id);
  return <DashboardShell user={user} title={school?.nome ?? "Escola não encontrada"} description={school ? "Dados da instituição e coordenação responsável." : "Esta escola não está disponível."} navigation={[{ label: "Escolas", href: "/admin/escolas", icon: "school" }, { label: "Coordenadores", href: "/admin/coordenadores", icon: "users" }]}>
    <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--blue)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar para escolas</Link>
    {query.isPending && <p role="status" className="mt-6">Carregando dados da escola…</p>}
    {query.error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">Não foi possível carregar a escola.</p>}
    {school && <div className="mt-6 space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <DashboardPanel id="school-information" title="Informações da escola"><dl className="grid gap-5 text-sm sm:grid-cols-2">{[["Nome", school.nome], ["CNPJ", school.cnpj], ["Logradouro", school.logradouro], ["Bairro", school.bairro], ["Cidade", school.cidade]].map(([label, value]) => <div key={label}><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="mt-1 break-words font-medium">{value || "--"}</dd></div>)}</dl></DashboardPanel>
        <DashboardPanel id="coordinator" title="Coordenador vinculado"><div className="flex gap-3 rounded-xl bg-[#e8f5f8] p-4"><UserRound aria-hidden="true" className="h-6 w-6 shrink-0 text-[var(--blue)]" /><div><h2 className="text-sm font-semibold">--</h2><p className="mt-1 text-xs text-[var(--muted)]">Vínculo ainda não disponível nesta rota.</p></div></div></DashboardPanel>
      </div>
      <DashboardPanel id="school-classrooms" title="Turmas da escola" description="Vínculo de turmas por escola ainda não está disponível na API."><p className="text-sm text-[var(--muted)]">--</p></DashboardPanel>
    </div>}
  </DashboardShell>;
}

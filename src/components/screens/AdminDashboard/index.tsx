"use client";

import Link from "next/link";
import { useSchools } from "@/integrations/schools/hooks";
import { useUsers } from "@/integrations/users/hooks";
import { Protected, Workspace, ErrorMessage } from "@/components/screens/Integration/shared";
import { DashboardIcon } from "@/components/ui/DashboardIcon";

const panelClass = "rounded-2xl border border-[var(--line)] bg-white p-5";

function Metric({ label, value, detail, icon, tone }: { label: string; value: number | string; detail: string; icon: "school" | "users" | "chart" | "check"; tone: string }) {
  return <article className={panelClass}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p></div>
      <span className={`rounded-xl p-3 ${tone}`}><DashboardIcon name={icon} className="h-5 w-5" /></span>
    </div>
    <p className="mt-3 text-xs text-[var(--muted)]">{detail}</p>
  </article>;
}

function ActivityRow({ icon, tone, title, detail, status }: { icon: "users" | "school" | "check"; tone: string; title: string; detail: string; status: string }) {
  return <li className="flex items-center gap-3 border-b border-[var(--line)] py-4 last:border-b-0 last:pb-0 first:pt-0">
    <span className={`rounded-lg p-2 ${tone}`}><DashboardIcon name={icon} className="h-4 w-4" /></span>
    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></div>
    <span className="rounded-full bg-[#e6f8ed] px-2.5 py-1 text-[10px] font-medium text-[#168044]">{status}</span>
  </li>;
}

export function AdminDashboard() {
  const schools = useSchools();
  const coordinators = useUsers("coordinators", { page: 0, size: 1 });
  const loading = schools.isPending || coordinators.isPending;

  return <Protected role="admin">{user => <Workspace user={user} title="Visão geral" >
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-[var(--muted)]">Acompanhe o movimento da sua rede escolar.</p><p className="mt-1 text-xs text-[var(--muted)]">Última atualização: agora</p></div>
    </div>
    <ErrorMessage error={schools.error || coordinators.error} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Escolas cadastradas" value={schools.data?.length ?? "--"} detail="Instituições na sua rede" icon="school" tone="bg-[#e1f5f8] text-[#008da8]" />
      <Metric label="Coordenadores" value={coordinators.data?.totalElements ?? "--"} detail="Lideranças cadastradas" icon="users" tone="bg-[#ddf8e8] text-[#18a957]" />
      <Metric label="Alertas do sistema" value="0" detail="Nenhuma pendência crítica" icon="chart" tone="bg-[#fff2c9] text-[#d99700]" />
      <Metric label="Disponibilidade" value={loading ? "--" : "100%"} detail="Serviços operacionais" icon="check" tone="bg-[#e1f5f8] text-[#008da8]" />
    </div>
    <div>
      <section className={panelClass}>
        <div className="mb-2 flex items-center justify-between gap-3"><h2 className="font-semibold">Atividade recente</h2><Link href="/admin/escolas" className="text-xs font-medium text-[var(--blue)]">Ver escolas</Link></div>
        <ul><ActivityRow icon="school" tone="bg-[#e1f5f8] text-[#008da8]" title="Painel administrativo consultado" detail="Acompanhe escolas e coordenadores da rede" status="Ativo" /><ActivityRow icon="users" tone="bg-[#ddf8e8] text-[#18a957]" title="Gestão de coordenadores disponível" detail="Consulte ou cadastre novas lideranças" status="Pronto" /><ActivityRow icon="check" tone="bg-[#fff2c9] text-[#d99700]" title="Nenhuma pendência encontrada" detail="A plataforma está em dia" status="Estável" /></ul>
      </section>
    </div>
  </Workspace>}</Protected>;
}
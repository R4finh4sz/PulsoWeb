"use client";

import { useSession } from "@/hooks/useSession";
import { mockUsers } from "@/mocks/platform";
import { getSchoolsForUser, getClassroomsForUser } from "@/services/dashboard";

import { StatCard } from "@/components/ui/StatCard";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";

export default function AdminHome() {
  const user = useSession("admin");
  if (!user) return <p role="status" className="p-8 text-sm">Carregando seu espaço…</p>;
  const schools = getSchoolsForUser(user);
  const coordinators = mockUsers.filter((account) => account.role === "coordenador");
  const pending = schools.filter((school) => !school.coordinatorId);

  return (
    <DashboardShell user={user} title="Uma visão de toda a rede." description="Organize as escolas e conecte cada uma à sua liderança pedagógica." navigation={[{ label: "Escolas", href: "#schools", icon: "school" }, { label: "Coordenadores", href: "#coordinators", icon: "users" }, { label: "Vínculos pendentes", href: "#pending", icon: "check" }]}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Escolas cadastradas" value={schools.length} detail="Sua rede de ensino" icon="school" />
        <StatCard label="Coordenadores" value={coordinators.length} detail="Lideranças cadastradas" icon="users" />
        <StatCard label="Turmas na rede" value={getClassroomsForUser(user).length} detail="Organizadas pelos coordenadores" icon="book" />
        <StatCard label="Vínculos pendentes" value={pending.length} detail="Escola aguardando coordenador" icon="check" />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <DashboardPanel id="schools" title="Escolas da rede" description="Cada escola tem seu espaço e um coordenador responsável.">
          <div className="space-y-4">{schools.map((school) => {
            const coordinator = coordinators.find((person) => person.id === school.coordinatorId);
            return <article key={school.id} className="rounded-xl border border-[var(--line)] p-4">
              <div className="flex flex-wrap items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f5f8] text-sm font-semibold text-[var(--blue)]">{school.initials}</span><div className="flex-1"><h3 className="text-sm font-semibold">{school.name}</h3><p className="mt-1 text-xs text-[var(--muted)]">{school.city}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-medium ${coordinator ? "bg-[#edf8f2] text-[#30714b]" : "bg-[#fff5d5] text-[#846900]"}`}>{coordinator ? "Coordenador vinculado" : "Vínculo pendente"}</span></div>
              <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">Coordenação: <span className="font-medium text-[var(--ink)]">{coordinator?.name ?? "Ainda não designada"}</span></p>
            </article>;
          })}</div>
        </DashboardPanel>
        <div className="space-y-6">
          <DashboardPanel id="coordinators" title="Coordenadores" description="Perfis criados pelo administrador.">
            {coordinators.map((person) => <div key={person.id} className="rounded-xl bg-[#f5f9fa] p-4"><p className="text-sm font-semibold">{person.name}</p><p className="mt-1 break-all text-xs text-[var(--muted)]">{person.email}</p><p className="mt-3 text-xs font-medium text-[var(--blue)]">{schools.filter((school) => school.coordinatorId === person.id).map((school) => school.name).join(", ") || "Sem escola vinculada"}</p></div>)}
          </DashboardPanel>
          <DashboardPanel id="pending" title="Próximo passo" description="Conclua a conexão entre escola e coordenação.">
            {pending.map((school) => <div key={school.id} className="rounded-xl bg-[#fff9e5] p-4"><p className="text-sm font-semibold">{school.name}</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Aguardando vínculo com um coordenador. Depois dessa etapa, a coordenação poderá organizar as turmas.</p></div>)}
          </DashboardPanel>
        </div>
      </div>
    </DashboardShell>
  );
}

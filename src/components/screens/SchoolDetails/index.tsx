"use client";

import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useSchoolStore } from "@/store/schoolStore";
import { useClassroomStore } from "@/store/classroomStore";
import { mockUsers } from "@/mocks/platform";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function SchoolDetails({ id }: { id: string }) {
  const user = useSession("admin");
  const schools = useSchoolStore((state) => state.schools);
  const rooms = useClassroomStore((state) => state.rooms);
  if (!user) return <p role="status" className="p-8 text-sm">Carregando escola…</p>;
  const school = schools.find((item) => item.id === id);
  const coordinator = mockUsers.find((person) => person.id === school?.coordinatorId && person.role === "coordenador");
  const schoolRooms = rooms.filter((room) => room.schoolId === id);

  return (
    <DashboardShell user={user} title={school?.name ?? "Escola não encontrada"} description={school ? "Dados da instituição e coordenação responsável." : "Esta escola não está disponível."} navigation={[{ label: "Escolas", href: "/admin/escolas/nova", icon: "school" }, { label: "Coordenadores", href: "/admin#coordinators", icon: "users" }]}>
      <Link href="/admin#schools" className="inline-flex items-center gap-2 text-sm text-[var(--blue)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar para escolas</Link>
      {school && <>
        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <DashboardPanel id="school-information" title="Informações da escola">
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              {[["Nome", school.name], ["CNPJ", school.cnpj], ["Logradouro", school.street], ["Estado", school.state ?? school.city.split(", ")[1]], ["Cidade", school.state ? school.city : school.city.split(", ")[0]]].map(([label, value]) => <div key={label}><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="mt-1 break-words font-medium">{value || "Não informado"}</dd></div>)}
            </dl>
          </DashboardPanel>
          <DashboardPanel id="coordinator" title="Coordenador vinculado">
            {coordinator ? <div className="flex gap-3 rounded-xl bg-[#e8f5f8] p-4"><UserRound aria-hidden="true" className="h-6 w-6 shrink-0 text-[var(--blue)]" /><div><h2 className="text-sm font-semibold">{coordinator.name}</h2><p className="mt-1 break-all text-xs text-[var(--muted)]">{coordinator.email}</p></div></div> : <p className="text-sm text-[var(--muted)]">Esta escola ainda não possui coordenador vinculado.</p>}
          </DashboardPanel>
        </div>
        <DashboardPanel id="school-classrooms" title="Turmas da escola" description={`${schoolRooms.length} turmas cadastradas`}>
          {schoolRooms.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{schoolRooms.map((room) => <article key={room.id} className="rounded-xl border border-[var(--line)] p-4"><h3 className="font-semibold">{room.name}</h3><p className="mt-2 text-xs text-[var(--muted)]">{room.period} · {room.students} alunos · {room.teacherIds.length} professores</p></article>)}</div> : <p className="text-sm text-[var(--muted)]">Nenhuma turma cadastrada nesta escola.</p>}
        </DashboardPanel>
      </>}
    </DashboardShell>
  );
}

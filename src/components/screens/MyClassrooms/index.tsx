"use client";

import { useSession } from "@/hooks/useSession";
import { useClassroomStore } from "@/store/classroomStore";
import { useSchoolStore } from "@/store/schoolStore";
import { getClassroomsForUser, getSchoolsForUser } from "@/services/dashboard";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { ClassroomCard } from "@/components/screens/Dashboard/ClassroomCard";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function MyClassrooms() {
  const user = useSession("professor");
  const allRooms = useClassroomStore((state) => state.rooms);
  const availableSchools = useSchoolStore((state) => state.schools);
  if (!user) return <p role="status" className="p-8 text-sm">Carregando suas turmas…</p>;
  const rooms = getClassroomsForUser(user, allRooms, availableSchools);
  const schools = getSchoolsForUser(user, allRooms, availableSchools);

  return (
    <DashboardShell
      user={user}
      title="Minhas turmas"
      description="Acesse as turmas às quais você está vinculado e acompanhe seus conteúdos e atividades."
      navigation={[
        { label: "Minhas turmas", href: "/professor/turmas", icon: "users" },
        { label: "Temas e quizzes", href: "/professor#content", icon: "chart" },
      ]}
    >
      <p className="text-sm text-[var(--muted)]">{rooms.length} {rooms.length === 1 ? "turma vinculada a você" : "turmas vinculadas a você"}</p>
      {rooms.length ? schools.map((school) => (
        <DashboardPanel key={school.id} id={`school-${school.id}`} title={school.name} description="Clique em uma turma para consultar seus detalhes e disciplinas.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.filter((room) => room.schoolId === school.id).map((room) => <ClassroomCard key={room.id} room={room} />)}
          </div>
        </DashboardPanel>
      )) : (
        <DashboardPanel id="classrooms" title="Suas turmas">
          <p className="rounded-xl bg-slate-50 p-6 text-sm text-[var(--muted)]">Você ainda não está vinculado a nenhuma turma. As turmas aparecerão aqui quando a coordenação fizer o vínculo.</p>
        </DashboardPanel>
      )}
    </DashboardShell>
  );
}

"use client";




import { useClassroomStore } from "@/store/classroomStore";
import { useSession } from "@/hooks/useSession";
import { getSchoolsForUser, getClassroomsForUser } from "@/services/dashboard";
import { mockUsers } from "@/mocks/platform";

import { StatCard } from "@/components/ui/StatCard";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { ClassroomCard } from "@/components/screens/Dashboard/ClassroomCard";

export default function CoordinatorHome() {
  const allRooms = useClassroomStore((state) => state.rooms);
  const user = useSession("coordenador");
  if (!user) return <p role="status" className="p-8 text-sm">Carregando seu espaço…</p>;
  const rooms = getClassroomsForUser(user, allRooms);
  const schools = getSchoolsForUser(user, allRooms);
  const teacherIds = new Set(rooms.flatMap((room) => room.teacherIds));
  const teachers = mockUsers.filter((person) => teacherIds.has(person.id));
  const pending = rooms.filter((room) => !room.teacherIds.length);

  return (
    <DashboardShell user={user} title="Conexões que fazem aprender." description={`${schools.map((school) => school.name).join(" · ")} — acompanhe suas turmas e organize quem faz parte de cada uma.`} navigation={[{ label: "Turmas", href: "/coordenador/turmas", icon: "book" }, { label: "Alunos", href: "#students", icon: "users" }, { label: "Professores", href: "#teachers", icon: "school" }]}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Turmas da escola" value={rooms.length} detail="Ensino fundamental" icon="book" />
        <StatCard label="Alunos vinculados" value={rooms.reduce((total, room) => total + room.students, 0)} detail="Distribuídos nas turmas" icon="users" />
        <StatCard label="Professores designados" value={teachers.length} detail="Com acesso às suas turmas" icon="school" />
        <StatCard label="Turmas sem professor" value={pending.length} detail="Aguardando designação" icon="check" />
      </div>
      <DashboardPanel id="classrooms" title="Turmas da escola" description="Uma visão dos alunos e professores vinculados a cada turma.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rooms.map((room) => <ClassroomCard key={room.id} room={room} />)}</div>
      </DashboardPanel>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DashboardPanel id="students" title="Alunos por turma" description="O vínculo com a turma dá acesso às disciplinas e aos quizzes.">
          <div className="space-y-4">{rooms.map((room) => <div key={room.id}><div className="mb-2 flex justify-between text-xs"><span className="font-medium">{room.name}</span><span className="text-[var(--muted)]">{room.students} alunos</span></div><div className="h-2 rounded-full bg-[#eef4f6]"><div className="h-2 rounded-full bg-[var(--blue)]" style={{ width: `${room.students / Math.max(...rooms.map((item) => item.students), 1) * 100}%` }} /></div></div>)}</div>
        </DashboardPanel>
        <DashboardPanel id="teachers" title="Designação de professores" description="O professor acessa somente as turmas às quais está vinculado.">
          {teachers.map((teacher) => <div key={teacher.id} className="rounded-xl bg-[#f1f8fa] p-4"><h3 className="text-sm font-semibold">{teacher.name}</h3><p className="mt-2 text-xs text-[var(--muted)]">{rooms.filter((room) => room.teacherIds.includes(teacher.id)).map((room) => room.name).join(" · ")}</p></div>)}
          {pending.length > 0 && <p className="mt-4 rounded-xl bg-[#fff9e5] p-4 text-xs leading-5 text-[#796413]">Atenção: {pending.map((room) => room.name).join(", ")} ainda sem professor designado.</p>}
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}

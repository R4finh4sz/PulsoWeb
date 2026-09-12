"use client";

import { useSession } from "@/hooks/useSession";
import { getClassroomsForUser, getSubjectsForUser } from "@/services/dashboard";

import { StatCard } from "@/components/ui/StatCard";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { ClassroomCard } from "@/components/screens/Dashboard/ClassroomCard";

export default function TeacherHome() {
  const user = useSession("professor");
  if (!user) return <p role="status" className="p-8 text-sm">Carregando seu espaço…</p>;
  const rooms = getClassroomsForUser(user);
  const subjects = getSubjectsForUser(user);

  return (
    <DashboardShell user={user} title="Ensinar transforma o amanhã." description="Suas turmas, seus conteúdos e novas oportunidades de aprendizagem, em um só lugar." navigation={[{ label: "Minhas turmas", href: "#classrooms", icon: "users" }, { label: "Disciplinas", href: "#subjects", icon: "book" }, { label: "Temas e quizzes", href: "#content", icon: "chart" }]}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Minhas turmas" value={rooms.length} detail="Designadas pela coordenação" icon="users" />
        <StatCard label="Minhas disciplinas" value={subjects.length} detail="Vinculadas às suas turmas" icon="book" />
        <StatCard label="Questões criadas" value={subjects.reduce((total, subject) => total + subject.questions, 0)} detail="Seu repertório de atividades" icon="check" />
        <StatCard label="Quizzes" value={subjects.reduce((total, subject) => total + subject.quizzes, 0)} detail="Organizados por disciplina" icon="chart" />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <DashboardPanel id="classrooms" title="Minhas turmas" description="Seu espaço de ensino começa aqui.">
          <div className="space-y-4">{rooms.map((room) => <ClassroomCard key={room.id} room={room} />)}</div>
        </DashboardPanel>
        <DashboardPanel id="subjects" title="Minhas disciplinas" description="Conteúdos gerenciados por você nas turmas designadas.">
          <div className="space-y-4">{subjects.map((subject) => <article key={subject.id} className="rounded-xl border border-[var(--line)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{subject.name}</h3><span className="rounded-full bg-[#e8f5f8] px-3 py-1 text-[10px] font-medium text-[var(--blue)]">{rooms.find((room) => room.id === subject.classroomId)?.name}</span></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">{subject.topic}</p><div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]"><span>{subject.topics} temas</span><span>{subject.questions} questões</span><span>{subject.quizzes} quizzes</span></div></article>)}</div>
        </DashboardPanel>
      </div>
      <DashboardPanel id="content" title="Seu planejamento de conteúdo" description="Temas conectam as disciplinas às questões e aos quizzes.">
        <div className="grid gap-4 sm:grid-cols-2">{subjects.map((subject) => <article key={subject.id} className="rounded-xl bg-[#f4f8fa] p-5"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--blue)]">{subject.name} · {rooms.find((room) => room.id === subject.classroomId)?.name}</p><h3 className="mt-2 text-sm font-semibold">{subject.topic}</h3><p className="mt-3 text-xs leading-5 text-[var(--muted)]">Os alunos vinculados à turma acessam as atividades desta disciplina.</p></article>)}</div>
      </DashboardPanel>
    </DashboardShell>
  );
}

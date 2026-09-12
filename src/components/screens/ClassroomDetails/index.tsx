"use client";

import Link from "next/link";
import { ArrowLeft, Plus, UserRound } from "lucide-react";
import type { UserRole } from "@/interfaces/auth";
import { useSchoolStore } from "@/store/schoolStore";
import { useSession } from "@/hooks/useSession";
import { useClassroomStore } from "@/store/classroomStore";
import { getClassroomsForUser, getSchoolsForUser, getSubjectsForUser } from "@/services/dashboard";
import { useTeacherStore } from "@/store/teacherStore";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import { StatCard } from "@/components/ui/StatCard";
import { AddTeachers } from "./AddTeachers";
import { RemoveTeacher } from "./RemoveTeacher";

export function ClassroomDetails({ id, role }: { id: string; role: Extract<UserRole, "coordenador" | "professor"> }) {
  const allTeachers = useTeacherStore((state) => state.teachers);
  const availableSchools = useSchoolStore((state) => state.schools);
  const user = useSession(role);
  const allRooms = useClassroomStore((state) => state.rooms);
  const allStudents = useClassroomStore((state) => state.students);
  if (!user) return <p role="status" className="p-8 text-sm">Carregando turma…</p>;

  const room = getClassroomsForUser(user, allRooms, availableSchools).find((item) => item.id === id);
  const back = role === "coordenador" ? "/coordenador/turmas" : "/professor/turmas";
  const navigation = [{ label: role === "coordenador" ? "Turmas" : "Minhas turmas", href: back, icon: "book" as const }];
  if (!room) return (
    <DashboardShell user={user} title="Turma não encontrada" description="Esta turma não existe ou não está disponível para o seu perfil." navigation={navigation}>
      <Link href={back} className="text-sm text-[var(--blue)]">Voltar para turmas</Link>
    </DashboardShell>
  );

  const school = getSchoolsForUser(user, allRooms, availableSchools).find((item) => item.id === room.schoolId);
  const teachers = allTeachers.filter((person) => person.role === "professor" && room.teacherIds.includes(person.id));
  const subjects = getSubjectsForUser(user, allRooms, availableSchools).filter((subject) => subject.classroomId === room.id);
  const students = allStudents.filter((student) => student.classroomId === room.id).sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));

  return (
    <DashboardShell user={user} title={room.name} description={`${school?.name ?? "Escola"} · Ensino médio · ${room.period}`} navigation={navigation}>
      <Link href={back} className="inline-flex items-center gap-2 text-sm text-[var(--blue)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar para turmas</Link>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Alunos vinculados" value={room.students} detail="Participantes da turma" icon="users" />
        <StatCard label="Professores" value={teachers.length} detail="Educadores designados" icon="school" />
        <StatCard label={role === "professor" ? "Minhas disciplinas" : "Disciplinas"} value={subjects.length} detail="Conteúdos vinculados à turma" icon="book" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.5fr]">
        <DashboardPanel id="information" title="Informações da turma">
          <dl className="space-y-4 text-sm">
            <div><dt className="text-xs text-[var(--muted)]">Turma</dt><dd className="mt-1 font-medium">{room.name}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Escola</dt><dd className="mt-1 font-medium">{school?.name}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Turno</dt><dd className="mt-1 font-medium">{room.period}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Etapa de ensino</dt><dd className="mt-1 font-medium">Ensino médio</dd></div>
          </dl>
        </DashboardPanel>
        <DashboardPanel id="teachers" title="Professores vinculados" description="Educadores com acesso a esta turma.">
          {user.role === "coordenador" && <AddTeachers key={room.id} user={user} room={room} />}
          {teachers.length ? <ul className="grid gap-3 sm:grid-cols-2">{teachers.map((teacher) => (
            <li key={teacher.id} className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-4">
              <span className="rounded-lg bg-[#e8f5f8] p-2 text-[var(--blue)]"><UserRound aria-hidden="true" className="h-5 w-5" /></span>
              <div className="min-w-0"><h3 className="text-sm font-semibold">{teacher.name}</h3><p className="mt-1 break-all text-xs text-[var(--muted)]">{teacher.email}</p></div>
              {user.role === "coordenador" && <RemoveTeacher user={user} roomId={room.id} teacher={teacher} />}
            </li>
          ))}</ul> : <p className="rounded-xl bg-[#fff9e5] p-4 text-sm text-[#796413]">Nenhum professor vinculado a esta turma.</p>}
        </DashboardPanel>
      </div>
      <DashboardPanel id="subjects" title={role === "professor" ? "Minhas disciplinas nesta turma" : "Disciplinas da turma"}>
        {user.role === "professor" && <div className="mb-5 flex justify-end">
          <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--blue)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            <Plus aria-hidden="true" className="h-4 w-4" />Criar disciplina
          </button>
        </div>}
        {subjects.length ? <div className="grid gap-4 sm:grid-cols-2">{subjects.map((subject) => (
          <article key={subject.id} className="rounded-xl border border-[var(--line)] p-5">
            <h3 className="font-semibold">{subject.name}</h3>
            <p className="mt-2 text-xs text-[var(--muted)]">Professor: {allTeachers.find((teacher) => teacher.id === subject.teacherId)?.name}{!room.teacherIds.includes(subject.teacherId) && " (sem vínculo atual com a turma)"}</p>
            <p className="mt-3 text-sm">{subject.topic}</p>
            <p className="mt-4 text-xs text-[var(--muted)]">{subject.topics} temas · {subject.questions} questões · {subject.quizzes} quizzes</p>
          </article>
        ))}</div> : <p className="text-sm text-[var(--muted)]">Nenhuma disciplina disponível para este perfil nesta turma.</p>}
      </DashboardPanel>
      <DashboardPanel id="students" title="Alunos" description="O vínculo com a turma dá acesso aos conteúdos e atividades.">
        {user.role === "coordenador" ? (
          <>
            {students.length ? <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{students.map((student) => (
              <li key={student.id} className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-4">
                <span className="shrink-0 rounded-lg bg-[#e8f5f8] p-2 text-[var(--blue)]"><UserRound aria-hidden="true" className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold">{student.name}</h3>
                  <p className="mt-1 break-all text-xs text-[var(--muted)]">{student.email}</p>
                  <p className="mt-2 break-words text-xs text-[var(--muted)]">Matrícula: {student.enrollment}</p>
                </div>
              </li>
            ))}</ul> : <p className="text-sm text-[var(--muted)]">Nenhum cadastro de aluno disponível nesta turma.</p>}
          </>
        ) : <p className="text-sm">{room.students ? `${room.students} alunos vinculados.` : "Esta turma ainda não possui alunos vinculados."}</p>}
      </DashboardPanel>
    </DashboardShell>
  );
}

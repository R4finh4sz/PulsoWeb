"use client";

import Link from "next/link";
import { Plus, UserRound } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useTeacherStore } from "@/store/teacherStore";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function Teachers() {
  const user = useSession("coordenador");
  const teachers = useTeacherStore((state) => state.teachers);
  if (!user) return <p role="status" className="p-8 text-sm">Carregando professores…</p>;
  return (
    <DashboardShell user={user} title="Professores" description="Consulte os professores cadastrados e adicione novos profissionais." navigation={[{ label: "Turmas", href: "/coordenador/turmas", icon: "book" }, { label: "Alunos", href: "/coordenador#students", icon: "users" }, { label: "Professores", href: "/coordenador/professores", icon: "school" }]}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted)]">{teachers.length} {teachers.length === 1 ? "professor cadastrado" : "professores cadastrados"}</p>
        <Link href="/coordenador/professores/novo" className="inline-flex items-center gap-2 rounded-lg bg-[var(--blue)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"><Plus aria-hidden="true" className="h-4 w-4" />Criar professor</Link>
      </div>
      <DashboardPanel id="teachers" title="Todos os professores" description="Profissionais disponíveis para vincular às turmas.">
        {teachers.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{teachers.map((teacher) => (
          <article key={teacher.id} className="min-w-0 rounded-xl border border-[var(--line)] p-5">
            <span className="inline-flex rounded-xl bg-[#e8f5f8] p-3 text-[var(--blue)]"><UserRound aria-hidden="true" className="h-5 w-5" /></span>
            <h3 className="mt-4 break-words text-sm font-semibold">{teacher.name}</h3>
            <p className="mt-2 break-words text-xs text-[var(--muted)]">{teacher.email}</p>
            <p className="mt-2 break-words text-xs text-[var(--muted)]">Matrícula: {teacher.registration || "Não informada"}</p>
          </article>
        ))}</div> : <p className="text-sm text-[var(--muted)]">Nenhum professor cadastrado. Clique em “Criar professor” para começar.</p>}
      </DashboardPanel>
    </DashboardShell>
  );
}

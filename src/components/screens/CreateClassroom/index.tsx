"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { ClassroomForm } from "./ClassroomForm";

export function CreateClassroom() {
  const user = useSession("coordenador");
  if (!user) return <p role="status" className="p-8 text-sm">Carregando seu espaço…</p>;
  return (
    <DashboardShell user={user} title="Uma nova turma começa aqui." description="Organize a turma e conecte os professores que acompanharão seus alunos." navigation={[{ label: "Turmas", href: "/coordenador/turmas", icon: "book" }, { label: "Alunos", href: "/coordenador#students", icon: "users" }, { label: "Professores", href: "/coordenador#teachers", icon: "school" }]}>
      <Link href="/coordenador/turmas" className="inline-flex items-center gap-2 text-sm text-[var(--blue)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar para turmas</Link>
      <ClassroomForm user={user} />
    </DashboardShell>
  );
}

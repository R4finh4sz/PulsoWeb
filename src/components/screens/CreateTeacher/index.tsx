"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { TeacherForm } from "./TeacherForm";

export function CreateTeacher() {
  const user = useSession("coordenador");
  if (!user) return <p role="status" className="p-8 text-sm">Carregando seu espaço…</p>;
  return (
    <DashboardShell user={user} title="Um novo professor na sua equipe." description="Cadastre os dados do professor para disponibilizá-lo para as turmas." navigation={[{ label: "Turmas", href: "/coordenador/turmas", icon: "book" }, { label: "Alunos", href: "/coordenador#students", icon: "users" }, { label: "Professores", href: "/coordenador/professores", icon: "school" }]}>
      <Link href="/coordenador/professores" className="inline-flex items-center gap-2 text-sm text-[var(--blue)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar para professores</Link>
      <TeacherForm user={user} />
    </DashboardShell>
  );
}

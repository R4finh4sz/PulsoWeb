"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { SchoolForm } from "./SchoolForm";

export function CreateSchool() {
  const user = useSession("admin");
  if (!user) return <p role="status" className="p-8 text-sm">Carregando seu espaço…</p>;
  return (
    <DashboardShell user={user} title="Uma nova escola na sua rede." description="Cadastre os dados da instituição para começar." navigation={[{ label: "Escolas", href: "/admin/escolas/nova", icon: "school" }, { label: "Coordenadores", href: "/admin#coordinators", icon: "users" }, { label: "Vínculos pendentes", href: "/admin#pending", icon: "check" }]}>
      <Link href="/admin#schools" className="inline-flex items-center gap-2 text-sm text-[var(--blue)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar para escolas</Link>
      <SchoolForm user={user} />
    </DashboardShell>
  );
}


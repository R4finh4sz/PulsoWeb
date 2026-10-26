"use client";

import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { useSession } from "@/hooks/useSession";
import { BackLink } from "@/components/ui/BackLink";
import { SchoolForm } from "./SchoolForm";

export function CreateSchool() {
  const user = useSession("admin");
  if (!user)
    return (
      <p role="status" className="p-8 text-sm">
        Carregando seu espaço…
      </p>
    );
  return (
    <DashboardShell
      user={user}
      title="Uma nova escola na sua rede."
      description="Cadastre os dados da instituição para começar."
      navigation={[
        { label: "Escolas", href: "/admin/schools/new", icon: "school" },
        { label: "Coordenadores", href: "/admin/coordinators", icon: "users" },
      ]}
    >
      <BackLink />
      <SchoolForm />
    </DashboardShell>
  );
}

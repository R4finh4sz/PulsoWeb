"use client";

import { SchoolForm } from "@/components/screens/CreateSchool/SchoolForm";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { BackLink } from "@/components/ui/BackLink";
import { useSession } from "@/hooks/useSession";

export default function NewSchoolPage() {
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

"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { DashboardIcon, type IconName } from "@/components/ui/DashboardIcon";
import Link from "next/link";

const shortcuts: {
  title: string;
  description: string;
  href: string;
  icon: IconName;
}[] = [
  {
    title: "Escolas",
    description: "Consulte e gerencie as escolas da rede.",
    href: "/admin/schools",
    icon: "school",
  },
  {
    title: "Cadastrar escola",
    description: "Adicione uma instituição à plataforma.",
    href: "/admin/schools/new",
    icon: "school",
  },
  {
    title: "Coordenadores",
    description: "Consulte os coordenadores cadastrados.",
    href: "/admin/coordinators",
    icon: "users",
  },
  {
    title: "Métricas",
    description: "Acompanhe os indicadores da plataforma.",
    href: "/admin/metrics",
    icon: "chart",
  },
  {
    title: "Solicitações de cadastro",
    description: "Analise os pedidos de acesso à plataforma.",
    href: "/admin/registration-requests",
    icon: "check",
  },
  {
    title: "Ranking",
    description: "Consulte a classificação da rede escolar.",
    href: "/admin/ranking",
    icon: "trophy",
  },
];

export default function AdminHome() {
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace
          user={user}
          title="Administração"
          description="Escolha o que você deseja gerenciar na plataforma."
        >
          <nav
            aria-label="Acesso rápido"
            className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {shortcuts.map(({ title, description, href, icon }) => (
              <Link
                key={href}
                href={href}
                title={description}
                className="flex min-h-36 min-w-0 flex-col items-center justify-center gap-3 rounded-xl bg-[#163e4b] px-5 py-7 text-center text-white transition-colors hover:bg-[#245362]"
              >
                <DashboardIcon name={icon} className="h-8 w-8" />
                <h2 className="text-base font-medium">{title}</h2>
              </Link>
            ))}
          </nav>
        </Workspace>
      )}
    </Protected>
  );
}

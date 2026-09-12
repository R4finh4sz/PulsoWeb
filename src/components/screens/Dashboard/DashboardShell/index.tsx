"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import logo from "@/assets/images/LogoImageWhite.png";
import { homeRoutes, roleLabels, type SessionUser } from "@/interfaces/auth";
import { useLoginStore } from "@/store/loginStore";
import { DashboardIcon, type IconName } from "@/components/ui/DashboardIcon";

type Props = {
  user: SessionUser;
  title: string;
  description: string;
  navigation: { label: string; href: string; icon: IconName }[];
  children: ReactNode;
};

const subscribeToHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

export function DashboardShell({ user, title, description, navigation, children }: Props) {
  const logout = useLoginStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const activeSection = useSyncExternalStore(subscribeToHash, () => window.location.hash || "#overview", () => "#overview");
  const home = homeRoutes[user.role];
  const links = [
    { label: "Início", href: pathname === home ? "#overview" : home, icon: "home" as const },
    ...navigation,
    ...(user.role === "coordenador" ? [{ label: "Criar aluno", href: "/coordenador/alunos/novo", icon: "users" as const }] : []),
  ];
  const isActive = (href: string) => {
    if (href.startsWith("#")) return activeSection === href;
    if (href.includes("#")) return pathname + activeSection === href;
    return pathname === href || (href !== home && pathname.startsWith(href + "/"));
  };

  return (
    <div className="min-h-screen bg-[#f5f8fa] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col bg-[var(--blue)] text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="border-b border-white/20 px-6 py-5">
          <Image src={logo} alt="Pulso Escolar" className="h-auto w-[180px]" sizes="180px" />
        </div>
        <nav aria-label="Navegação principal" className="flex flex-wrap gap-2 px-6 py-6 lg:flex-col lg:items-start">
          {links.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "location" : undefined}
              className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${isActive(item.href) ? "bg-white/25 font-medium" : ""}`}>
              <DashboardIcon name={item.icon} className="h-[18px] w-[18px]" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="mx-6 mb-6 mt-auto hidden rounded-xl bg-white/25 p-4 lg:block">
          <DashboardIcon name="help" className="mb-3 h-5 w-5" />
          <p className="text-xs font-semibold">Central de ajuda</p>
          <p className="mt-2 text-xs leading-5 text-white">Precisa de suporte? Fale com o responsável pela plataforma na sua escola.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] bg-white px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]"><span className="h-2 w-2 " /></div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f5f8] text-xs font-semibold text-[var(--blue)]">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
            <div><p className="text-xs font-semibold">{user.name}</p><p className="text-[10px] text-[var(--muted)]">{roleLabels[user.role]}</p></div>
            <button type="button" onClick={() => { logout(); router.replace("/"); }} className="ml-2 flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs hover:bg-slate-50"><DashboardIcon name="logout" className="h-4 w-4" />Sair</button>
          </div>
        </header>
        <main id="overview" className="mx-auto max-w-[1440px] space-y-7 px-5 py-8 sm:px-8 lg:px-10">
          <div><p className="text-xs font-medium text-[var(--blue)]">INÍCIO / VISÃO GERAL</p><h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p></div>
          {children}
        </main>
      </div>
    </div>
  );
}

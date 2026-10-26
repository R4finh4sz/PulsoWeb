"use client";

import logo from "@/assets/images/LogoImageWhite.png";
import { DemoAccess } from "@/components/screens/Login/DemoAccess";
import { useLogout } from "@/integrations/auth/hooks";
import type { SessionUser } from "@/interfaces/auth";
import { homeRoutes, roleLabels } from "@/interfaces/auth";
import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  House,
  Inbox,
  LogOut,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CoordinatorNotifications } from "@/components/screens/Dashboard/CoordinatorNotifications";
import { TeacherNotifications } from "@/components/screens/Dashboard/TeacherNotifications";

export function TeacherShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const coordinator = user.role === "coordenador";
  const home = homeRoutes[user.role];
  const links = coordinator
    ? [
      { label: "Início", href: home, icon: House },
      { label: "Alunos", href: `${home}/students`, icon: Users },
      { label: "Professores", href: `${home}/teachers`, icon: Users },
      {
        label: "Solicitações",
        href: `${home}/registration-requests`,
        icon: Inbox,
      },
    ]
    : [
      { label: "Início", href: "/teacher", icon: House },
      { label: "Minhas Turmas", href: "/teacher/classrooms", icon: BookOpen },
      {
        label: "Atividades",
        href: "/teacher/activities",
        icon: ClipboardList,
      },
      { label: "Relatório", href: "/teacher/reports", icon: ChartColumn },
    ];
  return (
    <div className="min-h-screen bg-[#eef5f7]">
      <header className="border-b border-[#214e5d] bg-[#163e4b]">
        <div
          className={`flex w-full flex-wrap items-center gap-x-5 gap-y-4 px-[10px] py-4 ${coordinator ? "2xl:grid 2xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" : "xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"}`}
        >
          <Link
            href={home}
            aria-label="Pulso Escolar — início"
            className="shrink-0 justify-self-start rounded-lg focus-visible:outline-white"
          >
            <Image
              src={logo}
              alt="Pulso Escolar"
              className="h-auto w-36"
              sizes="144px"
              priority
            />
          </Link>
          <nav
            aria-label="Navegação principal"
            className={`order-3 flex w-full gap-1 overflow-x-auto pb-1 md:justify-center ${coordinator ? "2xl:order-none 2xl:w-auto" : "xl:order-none xl:w-auto"}`}
          >
            {links.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={
                  (
                    href === home
                      ? pathname === href ||
                      (coordinator &&
                        pathname.startsWith(`${home}/classrooms`))
                      : pathname === href ||
                      pathname.startsWith(href + "/") ||
                      (href === "/teacher/classrooms" &&
                        pathname.startsWith("/teacher/schools/"))
                  )
                    ? "page"
                    : undefined
                }
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-[#d8e9ee] transition-colors duration-150 hover:bg-[#245362] hover:text-white focus-visible:outline-white aria-[current=page]:bg-[#dff3f7] aria-[current=page]:text-[#164b5b]"
              >
                <Icon aria-hidden="true" size={19} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 max-w-full items-center justify-self-end gap-2 sm:gap-3">
            {coordinator ? (
              <CoordinatorNotifications key={user.id} dark />
            ) : (
              <TeacherNotifications key={user.id} userId={user.id} dark />
            )}
            <Link
              href={`${home}/profile`}
              aria-label="Meu perfil"
              className="flex min-w-0 items-center gap-3 rounded-lg p-1 hover:bg-[#245362] focus-visible:outline-white"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-800"
                aria-hidden="true"
              >
                {user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p
                  className="max-w-40 truncate text-sm font-medium text-white"
                  title={user.name}
                >
                  {user.name.trim().split(/\s+/)[0]}
                </p>
                <p className="text-xs leading-5 text-[#bcd5dd]">
                  {roleLabels[user.role]}
                </p>
              </div>
            </Link>
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => router.replace("/"),
                })
              }
              className="ml-3 flex items-center gap-2 rounded-xl border border-[#6b939f] px-4 py-2.5 text-sm text-[#e4f0f3] hover:bg-[#245362] focus-visible:outline-white disabled:opacity-50"
            >
              <LogOut size={18} aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:py-12 xl:px-10">
        {logout.error && (
          <p role="alert" className="mb-4 text-sm text-red-700">
            {logout.error.message}
          </p>
        )}
        {children}
        <div className="mt-10">
          <DemoAccess />
        </div>
      </main>
    </div>
  );
}

"use client";

import logo from "@/assets/images/LogoImage.png";
import { DemoAccess } from "@/components/screens/Login/DemoAccess";
import { TeacherNotifications } from "./TeacherNotifications";
import { useLogout } from "@/integrations/auth/hooks";
import type { SessionUser } from "@/interfaces/auth";
import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  House,
  LogOut,
  Megaphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

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
  const links = [
    { label: "Início", href: "/teacher", icon: House },
    { label: "Minhas Turmas", href: "/teacher/classrooms", icon: BookOpen },
    { label: "Atividades", href: "/teacher/activities", icon: ClipboardList },
  ];
  return (
    <div className="min-h-screen bg-[#f2f8fa]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-4 px-5 py-4 sm:px-8 xl:px-10">
          <Link href="/teacher" aria-label="Pulso Escolar — início">
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
            className="order-3 flex w-full gap-1 overflow-x-auto pb-1 xl:order-none xl:w-auto xl:flex-1"
          >
            {links.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={
                  (
                    href === "/teacher"
                      ? pathname === href
                      : pathname.startsWith(href) ||
                        pathname.startsWith("/teacher/schools/")
                  )
                    ? "page"
                    : undefined
                }
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-cyan-50 aria-[current=page]:bg-[#e7f7fb] aria-[current=page]:text-[#087e9b]"
              >
                <Icon aria-hidden="true" size={19} />
                {label}
              </Link>
            ))}
            {[
              { label: "Avaliações", icon: ChartColumn },
              { label: "Relatórios", icon: Megaphone },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                title="Em breve"
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-slate-400"
              >
                <Icon size={19} aria-hidden="true" />
                {label}
                <span className="sr-only"> (em breve)</span>
              </button>
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 max-w-full items-center gap-2 sm:gap-3 xl:border-l xl:border-slate-200 xl:pl-4">
            <TeacherNotifications key={user.id} userId={user.id} />
            <Link
              href="/teacher/profile"
              aria-label="Meu perfil"
              className="flex min-w-0 items-center gap-3 rounded-lg p-1 hover:bg-cyan-50"
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
                  className="max-w-40 truncate text-sm font-medium text-slate-900"
                  title={user.name}
                >
                  {user.name}
                </p>
                <p className="text-xs leading-5 text-slate-500">Professor</p>
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
              className="ml-3 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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

"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMe } from "@/integrations/auth/hooks";
import { toSessionUser } from "@/integrations/auth/session";
import { homeRoutes, type SessionUser, type UserRole } from "@/interfaces/auth";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { ApiError } from "@/api/client";
import emptyImage from "@/assets/images/Empty.svg";
export const fieldClass = "mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-3 text-sm";
export const actionClass = "rounded-lg bg-[var(--blue)] px-4 py-2 text-sm text-white disabled:opacity-50 ";
export function EmptyState() {
  return <div className="flex flex-col items-center gap-3 py-8 text-center">
    <Image src={emptyImage} alt="" width={180} height={180} className="h-auto w-44" />
    <p>Nenhum cadastro encontrado.</p>
  </div>;
}
export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
    <p>{error instanceof Error ? error.message : "Não foi possível carregar os dados."}</p>
    {error instanceof ApiError && error.errors.map(message => <p key={message}>{message}</p>)}
  </div>;
}
export function Protected({ role, children }: { role: UserRole; children: (user: SessionUser) => ReactNode }) {
  const session = useMe();
  const router = useRouter();
  const user = session.data ? toSessionUser(session.data) : null;
  useEffect(() => {
    if (session.isPending || session.isError) return;
    if (!user) router.replace("/");
    else if (user.role !== role) router.replace(homeRoutes[user.role]);
  }, [session.isPending, session.isError, user, role, router]);
  if (session.error) return <main className="p-8"><ErrorMessage error={session.error} />
    <button className={actionClass} onClick={() => session.refetch()}>Tentar novamente</button></main>;
  if (!user || user.role !== role) return <p role="status" className="p-8">Carregando seu espaço…</p>;
  return children(user);
}
export function Workspace({ user, title, children }: { user: SessionUser; title: string; children: ReactNode }) {
  const navigation = user.role === "admin" ? [
    { label: "Escolas", href: "/admin/escolas", icon: "school" as const },
    { label: "Coordenadores", href: "/admin/coordenadores", icon: "users" as const },
  ] : user.role === "coordenador" ? [
    { label: "Turmas", href: "/coordenador/turmas", icon: "book" as const },
    { label: "Alunos", href: "/coordenador/alunos/novo", icon: "users" as const },
  ] : user.role === "professor" ? [
    { label: "Minhas turmas", href: "/professor/turmas", icon: "book" as const },
  ] : [];
  return <DashboardShell user={user} title={title} description="Acompanhe os cadastros e as turmas da plataforma." navigation={navigation}>{children}</DashboardShell>;
}

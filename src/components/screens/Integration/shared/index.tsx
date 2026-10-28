"use client";
import { ApiError } from "@/api/client";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { useMe } from "@/integrations/auth/hooks";
import { toSessionUser } from "@/integrations/auth/session";
import { homeRoutes, type SessionUser, type UserRole } from "@/interfaces/auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
export const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-(--line) bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--blue-dark)] focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-50";
export const actionClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--blue-dark)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#076a83] disabled:opacity-50 ";
export { EmptyState } from "@/components/ui/EmptyState";
export function ErrorMessage({ error }: { error: unknown; }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
      <p>
        {error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados."}
      </p>
      {error instanceof ApiError &&
        error.errors.map((message) => <p key={message}>{message}</p>)}
    </div>
  );
}
export function Protected({
  role,
  children,
}: {
  role: UserRole;
  children: (user: SessionUser) => ReactNode;
}) {
  const session = useMe();
  const router = useRouter();
  const user = session.data ? toSessionUser(session.data) : null;
  useEffect(() => {
    if (session.isPending || session.isError) return;
    if (!user) router.replace("/");
    else if (user.role !== role) router.replace(homeRoutes[user.role]);
  }, [session.isPending, session.isError, user, role, router]);
  if (session.error)
    return (
      <main className="p-8">
        <ErrorMessage error={session.error} />
        <button className={actionClass} onClick={() => session.refetch()}>
          Tentar novamente
        </button>
      </main>
    );
  if (!user || user.role !== role)
    return (
      <p role="status" className="p-8">
        Carregando seu espaço…
      </p>
    );
  return children(user);
}
export function Workspace({
  user,
  title,
  description = "Acompanhe os cadastros e as turmas da plataforma.",
  children,
}: {
  user: SessionUser;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const navigation =
    user.role === "admin"
      ? [
        { label: "Escolas", href: "/admin/schools", icon: "school" as const },
        {
          label: "Coordenadores",
          href: "/admin/coordinators",
          icon: "users" as const,
        },
      ]
      : user.role === "coordenador"
        ? [
          {
            label: "Turmas",
            href: "/coordinator/classrooms",
            icon: "book" as const,
          },
          {
            label: "Alunos",
            href: "/coordinator/students/new",
            icon: "users" as const,
          },
        ]
        : user.role === "professor"
          ? [
            {
              label: "Minhas turmas",
              href: "/teacher/classrooms",
              icon: "book" as const,
            },
          ]
          : [];
  return (
    <DashboardShell
      user={user}
      title={title}
      description={description}
      navigation={navigation}
    >
      {children}
    </DashboardShell>
  );
}

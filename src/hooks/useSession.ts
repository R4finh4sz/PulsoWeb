"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeRoutes, type UserRole } from "@/interfaces/auth";
import { useMe } from "@/integrations/auth/hooks";
import { toSessionUser } from "@/integrations/auth/session";
export function useSession(role: UserRole) {
  const router = useRouter();
  const session = useMe();
  const user = session.data ? toSessionUser(session.data) : null;
  useEffect(() => {
    if (session.isPending || session.isError) return;
    if (!user) router.replace("/");
    else if (user.role !== role) router.replace(homeRoutes[user.role]);
  }, [session.isPending, session.isError, user, role, router]);
  return user?.role === role ? user : null;
}

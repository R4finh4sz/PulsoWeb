"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useLoginStore } from "@/store/loginStore";
import { homeRoutes, type UserRole } from "@/interfaces/auth";
import { mockUsers } from "@/mocks/platform";

const subscribe = () => () => {};

export function useSession(role: UserRole) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const storedUser = useLoginStore((state) => state.user);
  const user = hydrated ? mockUsers.find((account) => account.id === storedUser?.id) ?? null : null;

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/");
    else if (user.role !== role) router.replace(homeRoutes[user.role]);
  }, [hydrated, user, role, router]);

  return user?.role === role ? user : null;
}


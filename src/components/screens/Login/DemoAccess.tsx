"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/integrations/auth/state";
import { homeRoutes, roleLabels } from "@/interfaces/auth";
import { toSessionUser } from "@/integrations/auth/session";
import {
  createDemoSession,
  demoUsers,
  mockAccessEnabled,
} from "@/mocks/access";

export function DemoAccess() {
  const client = useQueryClient();
  const router = useRouter();
  const session = useAuthState((state) => state.session);
  const [switching, setSwitching] = useState(false);
  if (!mockAccessEnabled) return null;
  return (
    <div className="my-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-800">
      <label className="flex flex-wrap items-center gap-3">
        <span className="font-medium">Acesso mock · sem backend</span>
        <select
          aria-label="Entrar ou trocar perfil de demonstração"
          disabled={switching}
          value={
            session?.accessToken.startsWith("pulso-mock:")
              ? session.accessToken.slice(11)
              : ""
          }
          className="rounded-lg border border-cyan-200 bg-white px-3 py-2"
          onChange={async (event) => {
            const user = demoUsers.find(
              (user) => user.id === Number(event.target.value),
            );
            if (!user) return;
            setSwitching(true);
            try {
              await client.cancelQueries();
              client.clear();
              useAuthState.getState().setSession(createDemoSession(user));
              router.replace(homeRoutes[toSessionUser(user).role]);
            } finally {
              setSwitching(false);
            }
          }}
        >
          <option value="" disabled>
            Escolha um perfil
          </option>
          {demoUsers
            .filter((user) => user.role !== "STUDENT")
            .map((user) => (
              <option key={user.id} value={user.id}>
                {roleLabels[toSessionUser(user).role]} · {user.fullName}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}

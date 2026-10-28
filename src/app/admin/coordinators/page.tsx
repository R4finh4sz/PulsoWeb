"use client";

import {
  actionClass,
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";
import { UserList } from "@/components/screens/Integration/Users";
export default function CoordinatorsListPage() {
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace user={user} title="Coordenadores">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-(--muted)">
              Gerencie os coordenadores cadastrados na plataforma.
            </p>
            <a className={actionClass} href="/admin/coordinators/new">
              Convidar coordenador
            </a>
          </div>
          <UserList resource="coordinators" />
        </Workspace>
      )}
    </Protected>
  );
}

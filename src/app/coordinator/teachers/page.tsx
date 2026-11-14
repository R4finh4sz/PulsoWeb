"use client";

import {
  actionClass,
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";
import { UserList } from "@/components/screens/Integration/Users";

export default function TeachersPage() {
  return (
    <Protected role="coordenador">
      {(user) => (
        <Workspace user={user} title="Professores">
          <div className="mb-6">
            <a className={actionClass} href="/coordinator/teachers/new">
              Convidar professor
            </a>
          </div>
          <UserList resource="teachers" canEdit={false} />
        </Workspace>
      )}
    </Protected>
  );
}


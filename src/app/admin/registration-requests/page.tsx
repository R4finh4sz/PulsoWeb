"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import {
  CoordinatorRequests,
  Requests,
} from "@/components/screens/Registration/Requests";
import type { UserRole } from "@/interfaces/auth";

function PageContent({
  role,
  initialType = "TEACHER",
}: {
  role: UserRole;
  initialType?: "TEACHER" | "DELETION";
}) {
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace
          user={user}
          title={
            role === "coordenador" ? "Solicitações" : "Solicitações de cadastro"
          }
          description="Acompanhe e aprove solicitações pendentes da plataforma."
        >
          {role === "coordenador" ? (
            <CoordinatorRequests initialType={initialType} />
          ) : (
            <Requests />
          )}
        </Workspace>
      )}
    </Protected>
  );
}

export default function RequestsPage() {
  return <PageContent role="admin" />;
}

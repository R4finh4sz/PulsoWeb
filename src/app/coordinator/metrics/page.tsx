"use client";

import { CoordinatorMetrics } from "@/components/screens/CoordinatorHome/Metrics";
import { CoordinatorGrowth } from "@/components/screens/CoordinatorHome/Growth";
import { Protected, Workspace } from "@/components/screens/Integration/shared";

export default function Page() {
  return (
    <Protected role="coordenador">
      {(user) => (
        <Workspace
          user={user}
          title="Métricas"
          description="Acompanhe os indicadores da sua escola."
        >
          <CoordinatorMetrics />
          <CoordinatorGrowth />
        </Workspace>
      )}
    </Protected>
  );
}

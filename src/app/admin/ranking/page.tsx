"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { CoordinatorRanking } from "@/components/screens/Ranking/CoordinatorRanking";

export default function Page() {
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace
          user={user}
          title="Ranking"
          description="Consulte a classificação dos alunos por ano, bimestre e escola."
        >
          <CoordinatorRanking admin />
        </Workspace>
      )}
    </Protected>
  );
}

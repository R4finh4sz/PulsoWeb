"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { CoordinatorRanking } from "@/components/screens/Ranking/CoordinatorRanking";

export default function Page() {
  return (
    <Protected role="coordenador">
      {(user) => (
        <Workspace
          user={user}
          title="Ranking"
          description="Acompanhe os destaques em acertos e participação entre todas as escolas."
        >
          <CoordinatorRanking />
        </Workspace>
      )}
    </Protected>
  );
}

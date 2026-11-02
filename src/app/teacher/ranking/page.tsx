"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { RankingContent } from "@/components/screens/Ranking";

export default function Page() {
  return (
    <Protected role="professor">
      {(user) => (
        <Workspace
          user={user}
          title="Ranking"
          description="Acompanhe os destaques em acertos e participação entre todas as escolas."
        >
          <RankingContent />
        </Workspace>
      )}
    </Protected>
  );
}

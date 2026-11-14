"use client";

import { CoordinatorWork } from "@/components/screens/CoordinatorHome";
import {
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";

export default function Page() {
  return (
    <Protected role="coordenador">
      {(user) => (
        <Workspace
          user={user}
          title="Coordenação escolar"
          description="Organize as turmas, acompanhe os cadastros e mantenha sua equipe conectada."
        >
          <CoordinatorWork />
        </Workspace>
      )}
    </Protected>
  );
}


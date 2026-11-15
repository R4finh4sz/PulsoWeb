"use client";

import { DataAgreementScreen } from "@/components/screens/DataAgreement";
import { Protected, Workspace } from "@/components/screens/Integration/shared";

export default function Page() {
  return (
    <Protected role="coordenador">
      {(user) => (
        <Workspace
          user={user}
          title="Termo de adesão institucional"
          description="Termo de adesão institucional e tratamento de dados."
        >
          <DataAgreementScreen />
        </Workspace>
      )}
    </Protected>
  );
}

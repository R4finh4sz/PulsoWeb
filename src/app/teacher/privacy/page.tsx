"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { LegalDocumentView } from "@/components/screens/LegalDocuments";
import { BackLink } from "@/components/ui/BackLink";

export default function Page() {
  return (
    <Protected role="professor">
      {(user) => (
        <Workspace user={user} title="Política de privacidade">
          <BackLink />
          <LegalDocumentView type="privacy" />
        </Workspace>
      )}
    </Protected>
  );
}

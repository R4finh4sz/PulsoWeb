"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { TermsContent } from "@/components/screens/Terms";
import { TermsActions } from "@/components/screens/Terms/TermsActions";
import { type UserRole } from "@/interfaces/auth";

function PageContent({
  role,
  edit = false,
}: {
  role: UserRole;
  edit?: boolean;
}) {
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Termos de uso">
          <TermsActions />
          <TermsContent role={role} edit={edit} />
        </Workspace>
      )}
    </Protected>
  );
}

export default function Page() {
  return <PageContent role="coordenador" />;
}

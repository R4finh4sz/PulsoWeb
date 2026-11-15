"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { LegalDocumentsAdmin } from "@/components/screens/LegalDocuments";
import { BackLink } from "@/components/ui/BackLink";
import { use } from "react";
import type { LegalDocType } from "@/integrations/legal/api";

const types: Record<string, LegalDocType> = {
  terms: "terms",
  privacy: "privacy",
  guardian: "guardian",
  student: "student",
  agreement: "agreement",
};

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = use(searchParams);
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace
          user={user}
          title="Contratos"
          description="Gerencie os termos, a política de privacidade e o termo de adesão institucional da plataforma."
        >
          <BackLink />
          <LegalDocumentsAdmin key={type} initialType={types[type ?? ""] ?? "terms"} />
        </Workspace>
      )}
    </Protected>
  );
}

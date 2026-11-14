"use client";

import { FaqEditor } from "@/components/screens/Faq/FaqForm";
import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace
          user={user}
          title="Editar pergunta"
          description="Atualize a pergunta, a resposta e o perfil do FAQ."
        >
          <FaqEditor id={id} user={user} />
        </Workspace>
      )}
    </Protected>
  );
}

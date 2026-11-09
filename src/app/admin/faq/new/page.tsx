"use client";

import { FaqForm } from "@/components/screens/Faq/FaqForm";
import { Protected, Workspace } from "@/components/screens/Integration/shared";

export default function Page() {
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace
          user={user}
          title="Criar pergunta"
          description="Cadastre uma pergunta e resposta para o perfil escolhido."
        >
          <FaqForm />
        </Workspace>
      )}
    </Protected>
  );
}

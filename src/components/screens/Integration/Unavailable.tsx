"use client";
import { Protected, Workspace } from "./shared";
export function UnavailableSchools() {
  return <Protected role="admin">{user => <Workspace user={user} title="Escolas">
    <p className="rounded-xl bg-white p-6">A gestão de escolas ainda não está disponível. Os cadastros de usuários e turmas podem ser acessados na página inicial.</p>
  </Workspace>}</Protected>;
}

"use client";

import { Protected, Workspace } from "@/components/screens/Integration/shared";
import { UserList } from "@/components/screens/Integration/Users";

export default function Page() {
  return (
    <Protected role="coordenador">
      {(user) => (
        <Workspace
          user={user}
          title="Alunos"
          description="Consulte os cadastros e organize os vínculos dos alunos com as turmas."
        >
          <div className="mb-6 flex justify-end"></div>
          <UserList resource="students" canEdit={false} />
        </Workspace>
      )}
    </Protected>
  );
}

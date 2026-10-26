"use client";

import {
  Protected,
  Workspace,
  actionClass
} from "@/components/screens/Integration/shared";
import { UserList } from "@/components/screens/Integration/Users";
import Link from "next/link";

export default function Page() {
  return (
    <Protected role="coordenador">
      {(user) => (
        <Workspace
          user={user}
          title="Alunos"
          description="Consulte os cadastros e organize os vínculos dos alunos com as turmas."
        >
          <div className="mb-6 flex justify-end">
            <Link href="/coordinator/students/new" className={actionClass}>
              Cadastrar aluno
            </Link>
          </div>
          <UserList resource="students" canEdit={false} />
        </Workspace>
      )}
    </Protected>
  );
}


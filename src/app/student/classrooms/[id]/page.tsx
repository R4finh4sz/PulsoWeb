"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import { Details } from "@/components/screens/Integration/Classrooms";
import {
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";
import type { UserRole } from "@/interfaces/auth";
import { use } from "react";

function PageContent({
  id,
  role,
}: {
  id: string;
  role: UserRole;
}) {
  return (
    <Protected role={role}>
      {(user) =>
        user.role === "professor" ? (
          <TeacherShell user={user}>
            <Details id={Number(id)} user={user} />
          </TeacherShell>
        ) : (
          <Workspace
            user={user}
            title="Detalhes da turma"
            description="Acompanhe e organize os alunos, professores e matérias da turma."
          >
            <Details id={Number(id)} user={user} />
          </Workspace>
        )
      }
    </Protected>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string; }>;
}) {
  const { id } = use(params);
  return <PageContent id={id} role="aluno" />;
}

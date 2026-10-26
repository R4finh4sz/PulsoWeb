"use client";

import { ClassroomList } from "@/components/screens/Integration/Classrooms";
import {
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";
import { UsersHome } from "@/components/screens/Integration/Users";
import type { UserRole } from "@/interfaces/auth";

function PageContent({ role }: { role: UserRole; }) {

  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Visão geral">
          <ClassroomList user={user} />
          <UsersHome user={user} />
        </Workspace>
      )}
    </Protected>
  );
}

export default function Page() {
  return <PageContent role="aluno" />;
}

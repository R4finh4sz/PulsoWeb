"use client";

import { ClassroomList } from "@/components/screens/Integration/Classrooms";
import {
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";
import type { UserRole } from "@/interfaces/auth";

function PageContent({ role }: { role: UserRole; }) {
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Turmas">
          <ClassroomList user={user} />
        </Workspace>
      )}
    </Protected>
  );
}

export default function ClassroomsPage() {
  return <PageContent role="coordenador" />;
}

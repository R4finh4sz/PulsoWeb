"use client";

import { base, ClassroomForm } from "@/components/screens/Integration/Classrooms";
import {
  actionClass,
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";
import type { Classroom } from "@/integrations/types";
import type { UserRole } from "@/interfaces/auth";
import Link from "next/link";
import { useState } from "react";

function PageContent({
  role = "coordenador",
}: {
  role?: UserRole;
}) {
  const [created, setCreated] = useState<Classroom | null>(null);
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Criar turma">
          {created ? (
            <Link
              className={actionClass}
              href={base(role) + "/classrooms/" + created.id}
            >
              Turma criada. Vincular alunos e professores
            </Link>
          ) : (
            <ClassroomForm onCreated={setCreated} />
          )}
        </Workspace>
      )}
    </Protected>
  );
}

export default function NewClassroomPage() {
  return <PageContent />;
}

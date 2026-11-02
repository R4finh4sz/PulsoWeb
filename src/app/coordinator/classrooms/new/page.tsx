"use client";

import { ClassroomForm } from "@/components/screens/Integration/Classrooms";
import {
  Protected,
  Workspace
} from "@/components/screens/Integration/shared";
import type { UserRole } from "@/interfaces/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

function PageContent({
  role = "coordenador",
}: {
  role?: UserRole;
}) {
  const [created, setCreated] = useState(false);
  const router = useRouter();
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Criar turma">
          {!created && (
            <ClassroomForm onCreated={() => setCreated(true)} onSuccessClose={() => router.back()} />
          )}
        </Workspace>
      )}
    </Protected>
  );
}

export default function NewClassroomPage() {
  return <PageContent />;
}

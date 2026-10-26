"use client";

import { SubjectForm } from "@/components/screens/ClassroomDetails/CreateSubject";
import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { useAuthState } from "@/integrations/auth/state";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import { use } from "react";

function PageContent({ classroomId }: { classroomId: number; }) {
  const token = useAuthState((state) => state.session?.accessToken);
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          {Number.isSafeInteger(classroomId) && classroomId > 0 ? (
            <SubjectForm
              classroomId={classroomId}
              canSave={mockAccessEnabled && !!getDemoUser(token)}
            />
          ) : (
            <p role="alert">Identificador de turma inválido.</p>
          )}
        </TeacherShell>
      )}
    </Protected>
  );
}

export default function Page({ params }: { params: Promise<{ id: string; }>; }) {
  const { id } = use(params);
  return <PageContent classroomId={Number(id)} />;
}

"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import { ClassroomList } from "@/components/screens/Integration/Classrooms";
import {
  ErrorMessage,
  Protected,
} from "@/components/screens/Integration/shared";
import { useSchools } from "@/integrations/schools/hooks";
import { use, useEffect } from "react";
import { useActiveSchool } from "@/integrations/auth/hooks";
import { useAuthState } from "@/integrations/auth/state";

export function PageContent({ id }: { id: number }) {
  const schools = useSchools();
  const activeSchoolId = useAuthState((state) => state.session?.user.schoolId);
  const { mutate, error, isPending } = useActiveSchool();
  const school = schools.data?.find((school) => school.id === id);
  useEffect(() => {
    if (school && activeSchoolId !== id) mutate(id);
  }, [school, activeSchoolId, id, mutate]);
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          <ErrorMessage error={schools.error || error} />
          {error && (
            <button onClick={() => mutate(id)} className="min-h-11 underline">
              Tentar novamente
            </button>
          )}
          {schools.isPending ? (
            <p role="status">Carregando escola…</p>
          ) : school ? (
            <div className="space-y-8">
              <div>
                <h1 className="page-title">{school.nome}</h1>
                <p className="page-description mt-3">Minhas turmas</p>
              </div>
              {activeSchoolId === id && !isPending ? (
                <ClassroomList user={user} schoolId={id} />
              ) : (
                !error && <p role="status">Carregando turmas da escola…</p>
              )}
            </div>
          ) : (
            schools.isSuccess && (
              <p>Escola não encontrada ou não vinculada ao seu perfil.</p>
            )
          )}
        </TeacherShell>
      )}
    </Protected>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PageContent id={Number(id)} />;
}

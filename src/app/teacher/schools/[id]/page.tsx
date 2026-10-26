"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import { ClassroomList } from "@/components/screens/Integration/Classrooms";
import {
  ErrorMessage,
  Protected,
} from "@/components/screens/Integration/shared";
import { useMe } from "@/integrations/auth/hooks";
import { useSchools } from "@/integrations/schools/hooks";
import { use } from "react";

function PageContent({ id }: { id: number; }) {
  const schools = useSchools();
  const me = useMe();
  const school = schools.data?.find(
    (school) =>
      school.id === id &&
      (school.teacherIds?.includes(me.data?.id ?? -1) ||
        school.id === me.data?.schoolId),
  );
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          <ErrorMessage error={schools.error} />
          {schools.isPending ? (
            <p role="status">Carregando escola…</p>
          ) : school ? (
            <div className="space-y-8">
              <div>
                <h1 className="page-title">{school.nome}</h1>
                <p className="page-description mt-3">Minhas turmas</p>
              </div>
              <ClassroomList user={user} schoolId={id} />
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

export default function Page({
  params,
}: {
  params: Promise<{ id: string; }>;
}) {
  const { id } = use(params);
  return <PageContent id={Number(id)} />;
}

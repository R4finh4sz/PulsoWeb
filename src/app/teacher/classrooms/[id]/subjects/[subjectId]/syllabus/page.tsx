"use client";

import { SyllabusContent } from "@/components/screens/ClassroomDetails/SubjectSyllabus/Content";
import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import { Protected } from "@/components/screens/Integration/shared";
import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ id: string; subjectId: string }>;
}) {
  const { id, subjectId } = use(params);
  const classroomId = Number(id);
  const disciplineId = Number(subjectId);
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          {Number.isSafeInteger(classroomId) &&
          classroomId > 0 &&
          Number.isSafeInteger(disciplineId) &&
          disciplineId > 0 ? (
            <SyllabusContent
              key={`${classroomId}:${disciplineId}`}
              classroomId={classroomId}
              subjectId={disciplineId}
              teacherId={Number(user.id)}
            />
          ) : (
            <p role="alert">Matéria inválida.</p>
          )}
        </TeacherShell>
      )}
    </Protected>
  );
}

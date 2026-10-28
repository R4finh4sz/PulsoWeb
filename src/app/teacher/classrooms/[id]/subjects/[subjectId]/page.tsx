"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { Content } from "@/components/screens/SubjectQuizzes";
import { use } from "react";

function PageContent({
  classroomId,
  subjectId,
}: {
  classroomId: number;
  subjectId: number;
}) {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          {Number.isSafeInteger(classroomId) &&
            classroomId > 0 &&
            Number.isSafeInteger(subjectId) &&
            subjectId > 0 ? (
            <Content
              key={`${classroomId}:${subjectId}`}
              classroomId={classroomId}
              subjectId={subjectId}
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

export default function Page({
  params,
}: {
  params: Promise<{ id: string; subjectId: string; }>;
}) {
  const { id, subjectId } = use(params);
  return <PageContent classroomId={Number(id)} subjectId={Number(subjectId)} />;
}

"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { Results } from "@/components/screens/QuizResults";
import { use } from "react";

function PageContent({ quizId }: { quizId: number; }) {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          {Number.isSafeInteger(quizId) && quizId > 0 ? (
            <Results quizId={quizId} />
          ) : (
            <p role="alert">Quiz inválido.</p>
          )}
        </TeacherShell>
      )}
    </Protected>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ quizId: string; }>;
}) {
  const { quizId } = use(params);
  return <PageContent quizId={Number(quizId)} />;
}

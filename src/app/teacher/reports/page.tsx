"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { Reports } from "@/components/screens/TeacherReports";
import { use } from "react";

function PageContent({
  classroomId,
  initialStatus = "ALL",
}: {
  classroomId?: number;
  initialStatus?: "ALL" | "CLOSED";
}) {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          <Reports classroomId={classroomId} initialStatus={initialStatus} />
        </TeacherShell>
      )}
    </Protected>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; }>;
}) {
  const { status } = use(searchParams);
  return <PageContent initialStatus={status === "CLOSED" ? "CLOSED" : "ALL"} />;
}

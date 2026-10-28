"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { Reports } from "@/components/screens/TeacherReports";
import { notFound } from "next/navigation";
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
  params,
  searchParams,
}: {
  params: Promise<{ id: string; }>;
  searchParams: Promise<{ status?: string; }>;
}) {
  const { id } = use(params);
  const classroomId = Number(id);
  if (!Number.isSafeInteger(classroomId) || classroomId <= 0) notFound();
  const { status } = use(searchParams);
  return <PageContent
    classroomId={classroomId}
    initialStatus={status === "CLOSED" ? "CLOSED" : "ALL"}
  />;
}

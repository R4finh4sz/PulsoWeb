import { TeacherReports } from "@/components/screens/TeacherReports";
import { notFound } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const classroomId = Number(id);
  if (!Number.isSafeInteger(classroomId) || classroomId <= 0) notFound();
  const { status } = await searchParams;
  return (
    <TeacherReports
      classroomId={classroomId}
      initialStatus={status === "CLOSED" ? "CLOSED" : "ALL"}
    />
  );
}

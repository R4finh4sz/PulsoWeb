import { TeacherReports } from "@/components/screens/TeacherReports";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return (
    <TeacherReports initialStatus={status === "CLOSED" ? "CLOSED" : "ALL"} />
  );
}

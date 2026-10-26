import { SchoolClassrooms } from "@/components/screens/TeacherHome/SchoolClassrooms";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SchoolClassrooms id={Number(id)} />;
}

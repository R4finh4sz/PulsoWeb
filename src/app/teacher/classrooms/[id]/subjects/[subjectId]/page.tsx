import { SubjectQuizzes } from "@/components/screens/SubjectQuizzes";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; subjectId: string }>;
}) {
  const { id, subjectId } = await params;
  return (
    <SubjectQuizzes classroomId={Number(id)} subjectId={Number(subjectId)} />
  );
}

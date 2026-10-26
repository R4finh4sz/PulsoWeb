import { StudentQuiz } from "@/components/screens/StudentQuizzes";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentQuiz id={Number(id)} />;
}

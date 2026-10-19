import { QuizResultsScreen } from "@/components/screens/QuizResults";

export default async function Page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <QuizResultsScreen quizId={Number(quizId)} />;
}

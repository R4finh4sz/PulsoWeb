import type { QuizQuestion } from "@/validation/Quiz.validation";

export function scoreQuiz(
  questions: QuizQuestion[],
  answers: (number | null)[],
) {
  let correct = 0;
  const themes = new Map<
    string,
    { theme: string; errors: number; total: number }
  >();
  const review = questions.map((question, index) => {
    const answer = answers[index] ?? null;
    const isCorrect = answer === question.correctOption;
    if (isCorrect) correct++;
    const theme = themes.get(question.theme) ?? {
      theme: question.theme,
      errors: 0,
      total: 0,
    };
    theme.total++;
    if (!isCorrect) theme.errors++;
    themes.set(question.theme, theme);
    return {
      question: question.question,
      theme: question.theme,
      answer: answer !== null ? (question.options[answer] ?? null) : null,
      correctAnswer: question.options[question.correctOption],
      isCorrect,
    };
  });
  return {
    correct,
    total: questions.length,
    grade: questions.length
      ? Math.round((correct / questions.length) * 100) / 10
      : 0,
    themes: [...themes.values()]
      .filter((theme) => theme.errors > 0)
      .sort(
        (a, b) =>
          b.errors - a.errors || a.theme.localeCompare(b.theme, "pt-BR"),
      ),
    review,
  };
}

import type { Quiz, StudentQuizResult } from "@/integrations/quizzes/api";
import type { Subject, User } from "@/integrations/types";
import { scoreQuiz } from "@/utils/quizResults";
import { CreateQuizSchema } from "@/validation/Quiz.validation";

const demoQuestions = [
  ...Array.from({ length: 4 }, (_, index) => ({
    question: `Quanto é ${index + 1} + 2?`,
    options: [
      String(index + 3),
      String(index + 4),
      String(index + 5),
      String(index + 6),
    ],
    theme: "Operações básicas",
    correctOption: 0,
  })),
  {
    question: "Quanto é 1/2 + 1/2?",
    options: ["1", "1/4", "2", "1/2"],
    theme: "Frações",
    correctOption: 0,
  },
  {
    question: "Qual fração representa a metade?",
    options: ["1/2", "1/3", "1/4", "2/3"],
    theme: "Frações",
    correctOption: 0,
  },
  {
    question: "Quanto é 1/4 + 1/4?",
    options: ["1/2", "1/8", "1", "3/4"],
    theme: "Frações",
    correctOption: 0,
  },
  {
    question: "Quantos lados tem um triângulo?",
    options: ["3", "4", "5", "6"],
    theme: "Geometria",
    correctOption: 0,
  },
  {
    question: "Qual é o perímetro de um quadrado de lado 2 cm?",
    options: ["8 cm", "4 cm", "6 cm", "2 cm"],
    theme: "Geometria",
    correctOption: 0,
  },
  {
    question: "Qual é a área de um quadrado de lado 3 cm?",
    options: ["9 cm²", "6 cm²", "12 cm²", "3 cm²"],
    theme: "Geometria",
    correctOption: 0,
  },
];
const quizzes: Quiz[] = [
  {
    id: 1,
    subjectId: 1,
    classroomId: 1,
    teacherId: 3,
    status: "OPEN",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    closesAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    questions: demoQuestions,
  },
  {
    id: 2,
    subjectId: 1,
    classroomId: 1,
    teacherId: 3,
    status: "CLOSED",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    closesAt: new Date(Date.now() - 86400000).toISOString(),
    questions: demoQuestions,
  },
];
export function mockTeacherQuizzes(current: User): Quiz[] {
  if (current.role !== "TEACHER")
    throw new Error("Somente professores podem consultar suas atividades.");
  return quizzes
    .filter((quiz) => quiz.teacherId === current.id)
    .map((quiz) => ({
      ...quiz,
      status:
        quiz.status === "CLOSED" || Date.parse(quiz.closesAt) <= Date.now()
          ? "CLOSED"
          : "OPEN",
    }));
}
export function mockQuizStudents(
  quiz: Quiz,
  users: User[],
): StudentQuizResult[] {
  return users
    .filter(
      (user) =>
        user.role === "STUDENT" && user.classroomId === quiz.classroomId,
    )
    .map((student, index) => {
      // Somente os dois quizzes de exemplo possuem entregas simuladas.
      const submitted =
        quiz.id <= 2 && (quiz.status === "CLOSED" || index < 30);
      const answers = quiz.questions.map((question, questionIndex) =>
        questionIndex < index % 11
          ? (question.correctOption + 1) % 4
          : question.correctOption,
      );
      return {
        studentId: student.id,
        name: student.fullName,
        ra: student.ra,
        submittedAt: submitted
          ? new Date(Date.parse(quiz.createdAt) + 3600000).toISOString()
          : null,
        score: submitted ? scoreQuiz(quiz.questions, answers) : null,
      };
    });
}
export function demoThemes(name: string): string[] {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  if (normalized.includes("matematica"))
    return [
      "Operações básicas",
      "Frações",
      "Geometria",
      "Porcentagem",
      "Álgebra",
    ];
  if (normalized.includes("portugues"))
    return ["Interpretação de texto", "Gramática", "Ortografia", "Literatura"];
  if (normalized.includes("historia"))
    return [
      "História do Brasil",
      "Antiguidade",
      "Idade Média",
      "História contemporânea",
    ];
  if (normalized.includes("geografia"))
    return [
      "Cartografia",
      "Clima e vegetação",
      "População",
      "Geografia do Brasil",
    ];
  if (normalized.includes("ciencia"))
    return [
      "Corpo humano",
      "Seres vivos",
      "Meio ambiente",
      "Matéria e energia",
    ];
  return [
    "Conceitos fundamentais",
    "Aplicações práticas",
    "Interpretação e análise",
    "Revisão geral",
  ];
}

export function mockSubjectQuizzes(
  subject: Subject,
  current: User,
  action: string,
  method: string,
  body: unknown,
) {
  if (current.role !== "TEACHER" || subject.teacherId !== current.id)
    throw new Error("Você não tem acesso aos quizzes desta matéria.");
  if (action === "themes" && method === "GET") return demoThemes(subject.name);
  if (action !== "quizzes") throw new Error("Ação de quiz não disponível.");
  if (method === "GET")
    return JSON.parse(
      JSON.stringify(
        mockTeacherQuizzes(current).filter(
          (quiz) =>
            quiz.subjectId === subject.id &&
            quiz.classroomId === subject.classroomId,
        ),
      ),
    );
  if (method !== "POST") throw new Error("Ação de quiz não disponível.");
  const parsed = CreateQuizSchema.safeParse(body);
  if (!parsed.success)
    throw new Error(
      "Preencha exatamente 10 questões, cada uma com pergunta, quatro alternativas diferentes, tema e resposta correta.",
    );
  const themes = demoThemes(subject.name);
  if (
    parsed.data.questions.some((question) => !themes.includes(question.theme))
  )
    throw new Error("Selecione um tema válido para cada questão.");
  const closesAt =
    parsed.data.closesAt ?? new Date(Date.now() + 7 * 86400000).toISOString();
  if (Date.parse(closesAt) <= Date.now())
    throw new Error("A data de encerramento deve estar no futuro.");
  const quiz: Quiz = {
    ...parsed.data,
    closesAt,
    id: quizzes.length + 1,
    subjectId: subject.id,
    classroomId: subject.classroomId,
    teacherId: current.id,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };
  quizzes.push(quiz);
  return JSON.parse(JSON.stringify(quiz)) as Quiz;
}

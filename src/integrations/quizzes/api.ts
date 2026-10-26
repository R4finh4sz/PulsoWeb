import { apiRequest } from "@/api/client";
import type { CreateQuiz } from "@/validation/Quiz.validation";
import { ThemeNameSchema } from "@/validation/Theme.validation";

export type Quiz = CreateQuiz & {
  id: number;
  subjectId: number;
  classroomId: number;
  teacherId: number;
  status: "OPEN" | "CLOSED";
  closesAt: string;
  createdAt: string;
};
export type TeacherActivity = Quiz & {
  subjectName: string;
  classroomName: string;
  schoolName: string;
};
export type StudentQuizResult = {
  studentId: number;
  name: string;
  ra: string;
  submittedAt: string | null;
  score: ReturnType<typeof import("@/utils/quizResults").scoreQuiz> | null;
};
export type QuizResults = {
  quiz: TeacherActivity;
  students: StudentQuizResult[];
};

const path = (classroomId: number, subjectId: number) =>
  `/classrooms/${classroomId}/subjects/${subjectId}`;

// Contrato demonstrativo; conectar aos endpoints definitivos quando disponíveis.
export type StudentQuiz = Omit<Quiz, "questions"> & {
  questions: Omit<CreateQuiz["questions"][number], "correctOption">[];
  subjectName?: string;
  submittedAt?: string | null;
};
export type Submission = {
  quizId: number;
  studentId: number;
  submittedAt: string;
  score: NonNullable<StudentQuizResult["score"]>;
};
export const quizzesApi = {
  removeTheme: (classroomId: number, subjectId: number, name: string) =>
    apiRequest<void>(path(classroomId, subjectId) + "/themes?" + new URLSearchParams({ name }), { method: "DELETE" }),
  studentList: (signal?: AbortSignal) => apiRequest<StudentQuiz[]>("/student/quizzes", { signal }),
  get: (id: number, signal?: AbortSignal) => apiRequest<StudentQuiz>(`/quizzes/${id}`, { signal }),
  result: (id: number, signal?: AbortSignal) => apiRequest<Submission>(`/quizzes/${id}/result`, { signal }),
  submit: (id: number, answers: (number | null)[]) => apiRequest<Submission>(`/quizzes/${id}/submit`, { method: "POST", body: { answers } }),
  createTheme: async (classroomId: number, subjectId: number, name: string) => apiRequest<string | { name: string }>(path(classroomId, subjectId) + "/themes", { method: "POST", body: { name: ThemeNameSchema.parse(name) } }),

  results: (quizId: number, signal?: AbortSignal) =>
    apiRequest<QuizResults>(`/teacher/activities/${quizId}/results`, {
      signal,
    }),
  activities: (signal?: AbortSignal) =>
    apiRequest<TeacherActivity[]>("/teacher/activities", { signal }),
  themes: (classroomId: number, subjectId: number, signal?: AbortSignal) =>
    apiRequest<(string | { name: string })[]>(path(classroomId, subjectId) + "/themes", { signal }).then((themes) => themes.map((theme) => typeof theme === "string" ? theme : theme.name)),
  list: (classroomId: number, subjectId: number, signal?: AbortSignal) =>
    apiRequest<Quiz[]>(path(classroomId, subjectId) + "/quizzes", { signal }),
  create: (classroomId: number, subjectId: number, body: CreateQuiz) =>
    apiRequest<Quiz>(path(classroomId, subjectId) + "/quizzes", {
      method: "POST",
      body,
    }),
};

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
export const quizzesApi = {
  createTheme: (classroomId: number, subjectId: number, name: string) =>
    apiRequest<string | { name: string }>(path(classroomId, subjectId) + "/themes", {
      method: "POST", body: { name: ThemeNameSchema.parse(name) },
    }),
  removeTheme: (classroomId: number, subjectId: number, name: string) =>
    apiRequest<void>(path(classroomId, subjectId) + "/themes?" + new URLSearchParams({ name }), { method: "DELETE" }),
  results: (quizId: number, signal?: AbortSignal) =>
    apiRequest<QuizResults>(`/teacher/activities/${quizId}/results`, {
      signal,
    }),
  activities: (signal?: AbortSignal) =>
    apiRequest<TeacherActivity[]>("/teacher/activities", { signal }),
  themes: (classroomId: number, subjectId: number, signal?: AbortSignal) =>
    apiRequest<string[]>(path(classroomId, subjectId) + "/themes", { signal }),
  list: (classroomId: number, subjectId: number, signal?: AbortSignal) =>
    apiRequest<Quiz[]>(path(classroomId, subjectId) + "/quizzes", { signal }),
  create: (classroomId: number, subjectId: number, body: CreateQuiz) =>
    apiRequest<Quiz>(path(classroomId, subjectId) + "/quizzes", {
      method: "POST",
      body,
    }),
};

import { teacherQuizzes } from "./teacher";
import { useAuthState } from "@/integrations/auth/state";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import { apiRequest } from "@/api/client";
import type { CreateQuiz } from "@/validation/Quiz.validation";

const demo = () =>
  mockAccessEnabled &&
  !!getDemoUser(useAuthState.getState().session?.accessToken);

export type Quiz = CreateQuiz & {
  questionCount?: number;
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
  reports: async (signal?: AbortSignal): Promise<QuizResults[]> => {
    if (!demo()) return teacherQuizzes.reports(signal);
    const activities = await quizzesApi.activities(signal);
    return Promise.all(
      activities.map((activity) => quizzesApi.results(activity.id, signal)),
    );
  },
  studentList: (signal?: AbortSignal) =>
    apiRequest<StudentQuiz[]>("/student/quizzes", { signal }),
  get: (id: number, signal?: AbortSignal) =>
    apiRequest<StudentQuiz>(`/quizzes/${id}`, { signal }),
  result: (id: number, signal?: AbortSignal) =>
    apiRequest<Submission>(`/quizzes/${id}/result`, { signal }),
  submit: (id: number, answers: (number | null)[]) =>
    apiRequest<Submission>(`/quizzes/${id}/submit`, {
      method: "POST",
      body: { answers },
    }),

  results: (quizId: number, signal?: AbortSignal) =>
    !demo()
      ? teacherQuizzes.results(quizId, signal)
      : apiRequest<QuizResults>(`/teacher/activities/${quizId}/results`, {
          signal,
        }),
  activities: (signal?: AbortSignal) =>
    !demo()
      ? teacherQuizzes.activities(signal)
      : apiRequest<TeacherActivity[]>("/teacher/activities", { signal }),
  themes: (classroomId: number, subjectId: number, signal?: AbortSignal) =>
    !demo()
      ? teacherQuizzes.themes(classroomId, subjectId, signal)
      : apiRequest<(string | { name: string })[]>(
          path(classroomId, subjectId) + "/themes",
          { signal },
        ).then((themes) =>
          themes.map((theme) =>
            typeof theme === "string" ? theme : theme.name,
          ),
        ),
  list: (classroomId: number, subjectId: number, signal?: AbortSignal) =>
    !demo()
      ? teacherQuizzes.list(classroomId, subjectId, signal)
      : apiRequest<Quiz[]>(path(classroomId, subjectId) + "/quizzes", {
          signal,
        }),
  create: (classroomId: number, subjectId: number, body: CreateQuiz) =>
    !demo()
      ? teacherQuizzes.create(subjectId, body)
      : apiRequest<Quiz>(path(classroomId, subjectId) + "/quizzes", {
          method: "POST",
          body,
        }),
};

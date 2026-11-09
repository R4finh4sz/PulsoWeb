import { apiRequest } from "@/api/client";
import { classroomsApi } from "@/integrations/classrooms/api";
import { subjectsApi } from "@/integrations/subjects/api";
import { schoolsApi } from "@/integrations/schools/api";
import { useAuthState } from "@/integrations/auth/state";
import type { CreateQuiz } from "@/validation/Quiz.validation";
import type { Quiz, QuizResults, TeacherActivity } from "./api";

type Activity = {
  id: number;
  subjectId: number;
  classroomId: number;
  schoolId: number;
  questionCount: number;
  createdAt: string;
  closesAt: string;
  status: "OPEN" | "FINISHED";
};
type Delivery = {
  studentId: number;
  submittedAt: string;
  score: number | null;
  correctAnswers: number | null;
  questionCount: number;
  themePerformance: {
    theme: string;
    questionCount: number;
    incorrectAnswers: number;
  }[];
};
type TeacherResponse = { activity: Activity; submissions: Delivery[] };

async function teacherActivities(signal?: AbortSignal) {
  const schoolId = useAuthState.getState().session?.user.schoolId ?? null;
  const rows = await apiRequest<TeacherResponse[]>("/teacher/activities", {
    signal,
  });
  return rows.filter(({ activity }) => activity.schoolId === schoolId);
}

function quiz(activity: Activity): Quiz {
  return {
    ...activity,
    teacherId: 0,
    questions: [],
    status: activity.status === "FINISHED" ? "CLOSED" : "OPEN",
  };
}

async function describe(
  activity: Activity,
  signal?: AbortSignal,
): Promise<TeacherActivity> {
  const [room, subjects, schools] = await Promise.all([
    classroomsApi.get(activity.classroomId, signal),
    subjectsApi.list(activity.classroomId, signal),
    schoolsApi.list(signal),
  ]);
  const subject = subjects.find((subject) => subject.id === activity.subjectId);
  return {
    ...quiz(activity),
    teacherId: subject?.teacherId ?? 0,
    subjectName: subject?.name ?? "Disciplina",
    classroomName: room.name,
    schoolName:
      schools.find((school) => school.id === activity.schoolId)?.nome ??
      "Escola",
  };
}

export const teacherQuizzes = {
  list: async (
    classroomId: number,
    subjectId: number,
    signal?: AbortSignal,
  ) => {
    const activities = await apiRequest<Activity[]>(
      `/classrooms/${classroomId}/subjects/${subjectId}/activities`,
      { signal },
    );
    return Promise.all(
      activities.map(async (activity) => {
        const detail = await apiRequest<{
          questions: Omit<CreateQuiz["questions"][number], "correctOption">[];
        }>(`/activities/${activity.id}/quiz`, { signal });
        // shortcut: no answer key is returned; replace the sentinel when a teacher answer-key endpoint exists.
        return {
          ...quiz(activity),
          questions: detail.questions.map((question) => ({
            ...question,
            correctOption: -1,
          })),
        };
      }),
    );
  },
  create: async (subjectId: number, body: CreateQuiz) => {
    if (!body.closesAt)
      throw new Error("Informe a data de encerramento do quiz.");
    const activity = await apiRequest<Activity>(
      `/subjects/${subjectId}/activities`,
      { method: "POST", body },
    );
    return { ...quiz(activity), questions: body.questions };
  },
  themes: async (
    classroomId: number,
    subjectId: number,
    signal?: AbortSignal,
  ) => {
    const subjects = await subjectsApi.list(classroomId, signal);
    return (
      subjects
        .find((subject) => subject.id === subjectId)
        ?.topics?.map((topic) => topic.title) ?? []
    );
  },
  activities: async (signal?: AbortSignal) => {
    const rows = await teacherActivities(signal);
    return Promise.all(
      rows.map(async ({ activity }) => {
        const result = await describe(activity, signal);
        return { ...result, questionCount: activity.questionCount };
      }),
    );
  },
  reports: async (signal?: AbortSignal): Promise<QuizResults[]> => {
    const rows = await teacherActivities(signal);
    return Promise.all(
      rows.map(({ activity }) =>
        teacherQuizzes.results(activity.id, signal, rows),
      ),
    );
  },
  results: async (
    id: number,
    signal?: AbortSignal,
    data?: TeacherResponse[],
  ): Promise<QuizResults> => {
    const rows = data ?? (await teacherActivities(signal));
    const row = rows.find(({ activity }) => activity.id === id);
    if (!row)
      throw new Error(
        "Atividade não encontrada ou não vinculada ao seu perfil.",
      );
    const [activity, students] = await Promise.all([
      describe(row.activity, signal),
      classroomsApi.students(row.activity.classroomId, signal),
    ]);
    return {
      quiz: activity,
      students: students.map((student) => {
        const delivery = row.submissions.find(
          (item) => item.studentId === student.id,
        );
        return {
          studentId: student.id,
          name: student.fullName,
          ra: student.ra,
          submittedAt: delivery?.submittedAt ?? null,
          score:
            delivery?.score != null
              ? {
                  grade: delivery.score / 10,
                  correct: delivery.correctAnswers ?? 0,
                  total: delivery.questionCount,
                  themes: delivery.themePerformance
                    .filter((theme) => theme.incorrectAnswers > 0)
                    .map((theme) => ({
                      theme: theme.theme,
                      errors: theme.incorrectAnswers,
                      total: theme.questionCount,
                    })),
                  review: [],
                }
              : null,
        };
      }),
    };
  },
};

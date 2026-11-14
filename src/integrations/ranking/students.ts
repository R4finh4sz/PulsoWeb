import { apiRequest, queryString } from "@/api/client";

export type StudentRanking = {
  position: number;
  studentId: number;
  studentName: string;
  totalActivities: number;
  totalScore: number;
  averageScore: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracyPercentage: number;
};

export const studentRankingApi = {
  list: (
    filters: { year: number; bimester: number; schoolId?: number },
    signal?: AbortSignal,
  ) =>
    apiRequest<StudentRanking[]>("/rankings/students" + queryString(filters), {
      signal,
    }),
};

import { ApiError, apiRequest, queryString } from "@/api/client";

export type RankingEntry = {
  studentId: number;
  name: string;
  schoolId: number;
  schoolName: string;
  grade: string | null;
  classroomName?: string | null;
  correctAnswers: number;
  completedActivities: number;
};

export type RankingData = {
  period: { label: string; startsAt: string; endsAt: string };
  schools: { id: number; name: string }[];
  grades: string[];
  classrooms?: { id: number; name: string; grade: string }[];
  entries: RankingEntry[];
  canFilterGlobalGrades: boolean;
};

export type RankingFilters = { schoolId?: string; grade?: string; classroomId?: string; classroomIdentifier?: string };

export const rankingApi = {
  get: async (signal?: AbortSignal, filters: RankingFilters = {}) => {
    try {
      return await apiRequest<RankingData>("/ranking" + queryString(filters), { signal });
    } catch (error) {
      if (error instanceof ApiError && [404, 501].includes(error.status))
        throw new Error(
          "O ranking ainda não está disponível. Tente novamente mais tarde.",
        );
      throw error;
    }
  },
};

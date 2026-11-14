import { apiRequest, queryString } from "@/api/client";

export type ReportSummary = {
  averageGrade: number | null;
  expectedSubmissions: number | null;
  submittedCount: number;
  completionPercentage: number | null;
  studentsWithOverdue: number | null;
  classroomCount: number;
  activityCount: number;
  recipientHistoryComplete: boolean;
};
export type ClassroomReport = Omit<ReportSummary, "classroomCount"> & {
  classroomId: number;
  classroomName: string;
  schoolId: number | null;
  schoolName: string | null;
  studentCount: number | null;
};
export type TeacherReport = {
  generatedAt: string;
  summary: ReportSummary;
  classrooms: ClassroomReport[];
};
export type ReportFilters = {
  schoolId?: number;
  classroomId?: number;
  status?: "FINISHED";
};
export const reportsApi = {
  get: (filters: ReportFilters = {}, signal?: AbortSignal) =>
    apiRequest<TeacherReport>("/teacher/reports" + queryString(filters), {
      signal,
    }),
};

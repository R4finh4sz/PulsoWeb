import { apiRequest, queryString } from "@/api/client";

export type SchoolGrowth = {
  schoolId: number;
  schoolName: string;
  year: number;
  months: {
    month: number;
    students: number;
    teachers: number;
    cumulativeStudents: number;
    cumulativeTeachers: number;
  }[];
  averageMonthlyStudents: number;
  averageMonthlyTeachers: number;
  studentsWithoutRegistrationDate: number;
  teachersWithoutRegistrationDate: number;
};

export type SchoolMetrics = {
  schoolId: number;
  schoolName: string;
  bigNumbers: {
    students: number;
    teachers: number;
    classrooms: number;
    subjects: number;
    activities: number;
    submissions: number;
  };
};

export type TechnicalSample = {
  timestamp: string;
  uptimeSeconds: number;
  intervalSeconds: number;
  requestsPerSecond: number;
  http5xxPercent: number;
  averageResponseMs: number;
  requestsPerSecondByStatus: Record<string, number>;
  processCpuPercent: number | null;
  heapUsedBytes: number | null;
  heapCommittedBytes: number | null;
  liveThreads: number | null;
  databaseActiveConnections: number | null;
  databaseIdleConnections: number | null;
};

export type TechnicalMetrics = {
  current: TechnicalSample | null;
  history: TechnicalSample[];
};

export const metricsApi = {
  admin: (signal?: AbortSignal) =>
    apiRequest<TechnicalMetrics>("/admin/metrics", { signal }),
  growth: (year: number, signal?: AbortSignal) =>
    apiRequest<SchoolGrowth>(
      "/schools/me/metrics/growth" + queryString({ year }),
      { signal },
    ),
  school: (signal?: AbortSignal) =>
    apiRequest<SchoolMetrics>("/schools/me/metrics", { signal }),
};

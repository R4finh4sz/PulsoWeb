import { apiRequest } from "@/api/client";
import type { Subject } from "../types";
export const MAX_SUBJECTS = 7;
export type SubjectInvitation = {
  id: number;
  email: string;
  subjectId: number;
  status: "PENDING";
};
export const subjectsApi = {
  list: (classroomId: number, signal?: AbortSignal) =>
    apiRequest<Subject[]>("/classrooms/" + classroomId + "/subjects", {
      signal,
    }),
  create: (classroomId: number, name: string) =>
    apiRequest<Subject>("/classrooms/" + classroomId + "/subjects", {
      method: "POST",
      body: { name },
    }),
  invite: (classroomId: number, subjectId: number, email: string) =>
    apiRequest<SubjectInvitation>(
      `/classrooms/${classroomId}/subjects/${subjectId}/invitations`,
      { method: "POST", body: { email } },
    ),
};

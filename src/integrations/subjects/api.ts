import { apiRequest } from "@/api/client";
import type { Subject } from "../types";
export const MAX_SUBJECTS = 7;
export type SubjectInvitation = {
  id: number;
  email: string;
  subjectId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  classroomId: number;
  subjectName: string;
  inviterName: string;
};
export const subjectsApi = {
  invitations: (signal?: AbortSignal) =>
    apiRequest<SubjectInvitation[]>("/subject-invitations", { signal }),
  respond: (id: number, status: "ACCEPTED" | "REJECTED") =>
    apiRequest<SubjectInvitation>("/subject-invitations/" + id, {
      method: "PATCH",
      body: { status },
    }),
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

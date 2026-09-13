import { apiRequest } from "@/api/client";
import type { Classroom, CreateClassroom, User } from "../types";
const path = (id: number) => "/classrooms/" + id;
export const classroomsApi = {
  list: (signal?: AbortSignal) => apiRequest<Classroom[]>("/classrooms", { signal }),
  get: (id: number, signal?: AbortSignal) => apiRequest<Classroom>(path(id), { signal }),
  create: (body: CreateClassroom) => apiRequest<Classroom>("/classrooms", { method: "POST", body }),
  update: (id: number, body: Partial<CreateClassroom>) => apiRequest<Classroom>(path(id), { method: "PATCH", body }),
  students: (id: number, signal?: AbortSignal) => apiRequest<User[]>(path(id) + "/students", { signal }),
  teachers: (id: number, signal?: AbortSignal) => apiRequest<User[]>(path(id) + "/teachers", { signal }),
  enroll: (id: number, studentId: number) => apiRequest<User>(path(id) + "/students/" + studentId, { method: "PUT" }),
  unenroll: (id: number, studentId: number) => apiRequest<void>(path(id) + "/students/" + studentId, { method: "DELETE" }),
  assign: (id: number, teacherId: number) => apiRequest<Classroom>(path(id) + "/teachers/" + teacherId, { method: "PUT" }),
  unassign: (id: number, teacherId: number) => apiRequest<void>(path(id) + "/teachers/" + teacherId, { method: "DELETE" }),
};

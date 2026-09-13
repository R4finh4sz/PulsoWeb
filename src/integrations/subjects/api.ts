import { apiRequest } from "@/api/client";
import type { Subject } from "../types";
export const subjectsApi = {
  list: (classroomId: number, signal?: AbortSignal) => apiRequest<Subject[]>("/classrooms/" + classroomId + "/subjects", { signal }),
  create: (classroomId: number, name: string) => apiRequest<Subject>("/classrooms/" + classroomId + "/subjects", { method: "POST", body: { name } }),
};

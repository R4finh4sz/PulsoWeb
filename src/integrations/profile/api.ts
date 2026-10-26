import { apiRequest } from "@/api/client";
import type { Classroom, User } from "@/integrations/types";
import type { School } from "@/integrations/schools/api";

export type TeacherProfile = {
  user: User;
  schools: School[];
  classrooms: Classroom[];
  deletionRequested: boolean;
};
export type ChangePassword = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
export type DeletionRequest = {
  currentPassword: string;
  reason: string;
};
export const profileApi = {
  get: (signal?: AbortSignal) =>
    apiRequest<TeacherProfile>("/me/profile", { signal }),
  changePassword: (body: ChangePassword) =>
    apiRequest<void>("/me/password", { method: "PUT", body }),
  export: () => apiRequest<Record<string, unknown>>("/me/export"),
  requestDeletion: (body: DeletionRequest) =>
    apiRequest<void>("/me/deletion-request", { method: "POST", body }),
};

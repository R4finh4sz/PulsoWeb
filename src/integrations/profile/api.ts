import { passwordError } from "@/validation/password";
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
  changePassword: (body: ChangePassword) => {
    if (body.newPassword !== body.confirmPassword)
      return Promise.reject(
        new Error("A confirmação deve ser igual à nova senha."),
      );
    const invalidPassword = passwordError(body.newPassword);
    if (invalidPassword) return Promise.reject(new Error(invalidPassword));
    return apiRequest<void>("/me/password", { method: "PUT", body });
  },
  export: () => apiRequest<Record<string, unknown>>("/me/export"),
  requestDeletion: (body: DeletionRequest) =>
    apiRequest<void>("/me/deletion-request", { method: "POST", body }),
};

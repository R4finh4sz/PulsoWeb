import { passwordError } from "@/validation/password";
import { apiRequest } from "@/api/client";
import type { Classroom, User } from "@/integrations/types";
import type { School } from "@/integrations/schools/api";

export type TeacherProfile = {
  user: User;
  schools: (School | { id: string; name: string })[];
  classrooms: Classroom[];
  deletionRequested: boolean;
  deletionRequest?: { status: "PENDING" | "APPROVED" | "REJECTED" } | null;
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
  photo: (signal?: AbortSignal) =>
    apiRequest<Blob | undefined>("/me/photo", {
      signal,
      headers: { Accept: "image/png, application/problem+json" },
      responseType: "blob",
      allowNotFound: true,
    }),
  updatePhoto: (photo: File) => {
    if (!["image/jpeg", "image/png"].includes(photo.type))
      return Promise.reject(new Error("Selecione uma imagem JPEG ou PNG."));
    if (photo.size > 2 * 1024 * 1024)
      return Promise.reject(new Error("A foto deve ter no máximo 2 MB."));
    const body = new FormData();
    body.append("photo", photo);
    return apiRequest<void>("/me/photo", { method: "PUT", body });
  },
  get: (signal?: AbortSignal) =>
    apiRequest<TeacherProfile>("/me/profile", { signal }),
  changePassword: (body: ChangePassword) => {
    if (body.newPassword !== body.confirmPassword)
      return Promise.reject(
        new Error("A confirmação deve ser igual à nova senha."),
      );
    const invalidPassword = passwordError(body.newPassword);
    if (invalidPassword) return Promise.reject(new Error(invalidPassword));
    return apiRequest<void>("/auth/password", {
      method: "PATCH",
      body: {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      },
    });
  },
  export: () => apiRequest<Record<string, unknown>>("/me/export"),
  requestDeletion: (body: DeletionRequest) =>
    apiRequest<void>("/me/deletion-requests", { method: "POST", body }),
};

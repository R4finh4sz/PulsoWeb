import { passwordError } from "@/validation/password";
import { apiRequest, queryString } from "@/api/client";
import type { Role } from "../types";

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Registration = {
  type?: "REGISTRATION" | "TRANSFER";
  originSchoolId?: number | null;
  userId?: number;
  id: number;
  name: string;
  email: string;
  ra: string;
  birthDate: string | null;
  role: Role;
  schoolName: string;
  status: RegistrationStatus;
  reviewReason: string | null;
  hasPhoto: boolean;
};
export type RegistrationInput = {
  name: string;
  ra: string;
  email: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  schoolId: number;
  termsAccepted: boolean;
  termsVersion: string;
};
export type Invitation = {
  email: string;
  schoolName: string;
  role: Role;
  verified: boolean;
  expiresAt: string;
  resendAvailableAt: string;
};
export const registrationApi = {
  transferStudent: (body: { fullName: string; ra: string; schoolId: number }) =>
    apiRequest<{ id: number; status: RegistrationStatus }>("/students/transfer", { method: "POST", body }),
  photo: (id: number, signal?: AbortSignal, type: "REGISTRATION" | "TRANSFER" = "REGISTRATION") =>
    apiRequest<Blob>(`/registration-requests/${id}/photo` + queryString({ type }), {
      signal,
      responseType: "blob",
      headers: { Accept: "image/png" },
    }),
  schools: (q: string, signal?: AbortSignal) =>
    apiRequest<{
      content: { id: string; name: string; city: string; state: string }[];
      totalPages: number;
    }>("/schools/search" + queryString({ q, size: 100 }), { signal }),
  register: async (body: RegistrationInput, photo?: File) => {
    const invalidPassword = passwordError(body.password);
    if (invalidPassword) throw new Error(invalidPassword);
    if (body.password !== body.confirmPassword)
      throw new Error("As senhas precisam ser iguais.");
    if (!photo)
      return apiRequest<{ id: number; status: RegistrationStatus }>(
        "/auth/register",
        { method: "POST", body },
      );
    const data = new FormData();
    data.set("data", JSON.stringify(body));
    data.set("photo", photo);
    return apiRequest<{ id: number; status: RegistrationStatus }>(
      "/auth/register",
      { method: "POST", body: data },
    );
  },
  invite: (
    resource: "teachers" | "coordinators",
    body: { email: string; schoolId?: number },
  ) =>
    apiRequest<{ delivery: "INTERNAL" | "EMAIL" }>("/invitations/" + resource, {
      method: "POST",
      body: resource === "teachers" ? { email: body.email } : body,
    }),
  invitation: (token: string, signal?: AbortSignal) =>
    apiRequest<Invitation>("/invitations/" + encodeURIComponent(token), {
      signal,
    }),
  verify: (token: string, code: string) =>
    apiRequest<Invitation>(
      "/invitations/" + encodeURIComponent(token) + "/verify",
      { method: "POST", body: { code } },
    ),
  resend: (token: string) =>
    apiRequest<Invitation>(
      "/invitations/" + encodeURIComponent(token) + "/resend",
      { method: "POST" },
    ),
  complete: async (
    token: string,
    body: {
      name: string;
      ra: string;
      password: string;
      termsAccepted: boolean;
      termsVersion: string;
    },
  ) => {
    const invalidPassword = passwordError(body.password);
    if (invalidPassword) throw new Error(invalidPassword);
    return apiRequest(
      "/invitations/" + encodeURIComponent(token) + "/complete",
      {
        method: "POST",
        body: {
          name: body.name,
          ra: body.ra.trim(),
          password: body.password,
          termsAccepted: body.termsAccepted,
          termsVersion: body.termsVersion,
        },
      },
    );
  },
  list: (status: RegistrationStatus, page: number, signal?: AbortSignal) =>
    apiRequest<{ content: Registration[]; totalPages: number }>(
      "/registration-requests" + queryString({ status, page, size: 20 }),
      { signal },
    ),
  review: (id: number, status: RegistrationStatus, reason: string, options?: { type: "REGISTRATION" | "TRANSFER"; classroomId?: number }) =>
    apiRequest<Registration>(`/registration-requests/${id}`, {
      method: "PATCH",
      body: { status, ...(reason ? { reason } : {}), type: options?.type ?? "REGISTRATION", ...options },
    }),
};

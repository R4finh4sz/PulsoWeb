import { apiRequest, queryString } from "@/api/client";
import type { Role } from "../types";

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Registration = { id: number; name: string; email: string; ra: string; birthDate: string | null; role: Role; schoolName: string; status: RegistrationStatus; reviewReason: string | null; hasPhoto: boolean };
export type RegistrationInput = { name: string; ra: string; email: string; birthDate: string; password: string; schoolId: number; termsAccepted: boolean; termsVersion: string };
export type Invitation = { email: string; schoolName: string; role: Role; verified: boolean; expiresAt: string; resendAvailableAt: string };
export const registrationApi = {
  photo: (id: number, signal?: AbortSignal) => apiRequest<Blob>(`/registration-requests/${id}/photo`, { signal, responseType: "blob", headers: { Accept: "image/png" } }),
  schools: (q: string, signal?: AbortSignal) => apiRequest<{ content: { id: string; name: string; city: string; state: string }[]; totalPages: number }>("/schools/search" + queryString({ q, size: 100 }), { signal }),
  register: (body: RegistrationInput, photo?: File) => {
    if (!photo) return apiRequest<{ id: number; status: RegistrationStatus }>("/auth/register", { method: "POST", body });
    const data = new FormData(); data.set("data", JSON.stringify(body)); data.set("photo", photo);
    return apiRequest<{ id: number; status: RegistrationStatus }>("/auth/register", { method: "POST", body: data });
  },
  invite: (resource: "teachers" | "coordinators", body: { email: string; schoolId?: number }) => apiRequest("/invitations/" + resource, { method: "POST", body }),
  invitation: (token: string, signal?: AbortSignal) => apiRequest<Invitation>("/invitations/" + encodeURIComponent(token), { signal }),
  verify: (token: string, code: string) => apiRequest<Invitation>("/invitations/" + encodeURIComponent(token) + "/verify", { method: "POST", body: { code } }),
  resend: (token: string) => apiRequest<Invitation>("/invitations/" + encodeURIComponent(token) + "/resend", { method: "POST" }),
  complete: (token: string, body: { name: string; ra: string; password: string; termsAccepted: boolean; termsVersion: string }) => apiRequest("/invitations/" + encodeURIComponent(token) + "/complete", { method: "POST", body }),
  list: (status: RegistrationStatus, page: number, signal?: AbortSignal) => apiRequest<{ content: Registration[]; totalPages: number }>("/registration-requests" + queryString({ status, page, size: 20 }), { signal }),
  review: (id: number, status: RegistrationStatus, reason: string) => apiRequest<Registration>(`/registration-requests/${id}`, { method: "PATCH", body: { status, reason } }),
};

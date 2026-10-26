import { apiRequest } from "@/api/client";

export type School = {
  teacherIds?: number[];
  id: number;
  nome: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  cep?: string | null;
  uf?: string | null;
  coordinator?: { id: number; fullName: string; email: string } | null;
};

export type CreateSchool = Omit<School, "id">;

export type SchoolInvitation = {
  id: number;
  email: string;
  schoolId: number;
  schoolName: string;
  inviterName: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

export const schoolsApi = {
  invitations: (signal?: AbortSignal) =>
    apiRequest<SchoolInvitation[]>("/school-invitations", { signal }),
  respond: (id: number, status: "ACCEPTED" | "REJECTED") =>
    apiRequest<SchoolInvitation>("/school-invitations/" + id, {
      method: "PATCH",
      body: { status },
    }),
  list: (signal?: AbortSignal) => apiRequest<School[]>("/schools", { signal }),
  create: (body: CreateSchool) =>
    apiRequest<School>("/schools", { method: "POST", body }),
};

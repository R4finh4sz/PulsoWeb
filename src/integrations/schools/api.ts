import { apiRequest } from "@/api/client";

export type School = {
  id: number;
  nome: string;
  cnpj: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  cep?: string | null;
  uf?: string | null;
  coordinator?: { id: number; fullName: string; email: string } | null;
};

export type CreateSchool = Omit<School, "id">;

export const schoolsApi = {
  list: (signal?: AbortSignal) => apiRequest<School[]>("/schools", { signal }),
  create: (body: CreateSchool) => apiRequest<School>("/schools", { method: "POST", body }),
};

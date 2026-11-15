import { ApiError, apiRequest } from "@/api/client";

export type LegalDocType =
  | "terms"
  | "privacy"
  | "guardian"
  | "student"
  | "agreement";
export type LegalDocument = {
  title: string;
  version: string;
  content: string;
  publishedAt?: string | null;
};
export const legalTypes: Record<
  LegalDocType,
  { label: string; path: string; audience: string; defaultTitle: string }
> = {
  terms: {
    label: "Termos de uso",
    path: "/terms",
    audience:
      "professores e coordenadores, que precisarão aceitar a nova versão",
    defaultTitle: "Termos de uso",
  },
  privacy: {
    label: "Política de privacidade",
    path: "/privacy-policy",
    audience: "todos os usuários e visitantes",
    defaultTitle: "Política de privacidade",
  },
  guardian: {
    label: "Termo do responsável",
    path: "/guardian-term",
    audience: "os responsáveis legais de alunos menores de idade",
    defaultTitle: "Termo do responsável legal",
  },
  student: {
    label: "Termo do estudante",
    path: "/student-term",
    audience: "os estudantes",
    defaultTitle: "Termo do estudante",
  },
  agreement: {
    label: "Termo de adesão institucional e tratamento de dados",
    path: "/data-agreement",
    audience:
      "as escolas, cujos coordenadores precisarão aceitar a nova versão",
    defaultTitle: "Termo de adesão institucional e tratamento de dados",
  },
};
export const legalTypeList = Object.keys(legalTypes) as LegalDocType[];

export const legalApi = {
  current: async (type: LegalDocType, signal?: AbortSignal) => {
    try {
      return await apiRequest<LegalDocument>(legalTypes[type].path, { signal });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  history: (type: LegalDocType, signal?: AbortSignal) =>
    apiRequest<LegalDocument[]>(legalTypes[type].path + "/history", { signal }),
  publish: (
    type: LegalDocType,
    body: Pick<LegalDocument, "title" | "content">,
    exists: boolean,
  ) =>
    apiRequest<LegalDocument>(legalTypes[type].path, {
      method: exists ? "PUT" : "POST",
      body,
    }),
};

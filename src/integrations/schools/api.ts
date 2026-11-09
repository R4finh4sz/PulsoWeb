import { apiRequest, queryString } from "@/api/client";
import { useAuthState } from "@/integrations/auth/state";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";

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
  expiresAt?: string;
  id: number;
  email?: string;
  schoolId: number;
  schoolName: string;
  inviterName?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

export const schoolsApi = {
  searchByCep: (cep: string, page = 0, signal?: AbortSignal) =>
    apiRequest<{
      content: {
        id: string;
        name: string;
        city: string;
        state: string;
        cep: string | null;
      }[];
      totalPages: number;
    }>("/schools/search" + queryString({ cep, page, size: 20 }), { signal }),
  invitations: (signal?: AbortSignal) =>
    apiRequest<SchoolInvitation[]>("/me/school-invitations", { signal }),
  respond: (id: number, status: "ACCEPTED" | "REJECTED") =>
    apiRequest<SchoolInvitation>("/me/school-invitations/" + id, {
      method: "PATCH",
      body: { status },
    }),
  list: async (signal?: AbortSignal): Promise<School[]> => {
    const session = useAuthState.getState().session;
    if (
      session?.user.role === "TEACHER" &&
      !(mockAccessEnabled && getDemoUser(session.accessToken))
    ) {
      const profile = await apiRequest<{
        schools: { id: string; name: string; city: string; state: string }[];
      }>("/me/profile", { signal });
      return profile.schools.map((school) => ({
        id: Number(school.id),
        nome: school.name,
        cidade: school.city,
        uf: school.state,
        logradouro: "",
        bairro: "",
      }));
    }
    return apiRequest<School[]>("/schools", { signal });
  },
  create: (body: CreateSchool) =>
    apiRequest<School>("/schools", { method: "POST", body }),
};

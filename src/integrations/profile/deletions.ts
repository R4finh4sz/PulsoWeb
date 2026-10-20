import { apiRequest, queryString } from "@/api/client";

export type AccountDeletion = {
  id: number;
  name: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  reason: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

// Contrato para a fila de análise de exclusões de conta.
export const accountDeletionsApi = {
  list: (status: AccountDeletion["status"], signal?: AbortSignal) =>
    apiRequest<AccountDeletion[]>(
      "/account-deletion-requests" + queryString({ status }),
      { signal },
    ),
  review: (id: number, status: "APPROVED" | "REJECTED") =>
    apiRequest<void>(`/account-deletion-requests/${id}`, {
      method: "PATCH",
      body: { status },
    }),
};

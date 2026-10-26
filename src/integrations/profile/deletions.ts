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

type AccountDeletionPage = {
  content: AccountDeletion[];
  totalPages?: number;
};

function deletionItems(response: AccountDeletion[] | AccountDeletionPage) {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.content)) return response.content;
  throw new Error("Formato inválido na resposta dos pedidos de exclusão.");
}

export const accountDeletionsApi = {
  list: async (status: AccountDeletion["status"], signal?: AbortSignal) => {
    const first = await apiRequest<AccountDeletion[] | AccountDeletionPage>(
      "/account-deletion-requests" + queryString({ status }),
      { signal },
    );
    const items = deletionItems(first);
    if (Array.isArray(first)) return items;
    const pages = await Promise.all(
      Array.from({ length: Math.max(0, (first.totalPages ?? 1) - 1) }, (_, index) =>
        apiRequest<AccountDeletion[] | AccountDeletionPage>(
          "/account-deletion-requests" + queryString({ status, page: index + 1 }),
          { signal },
        ).then(deletionItems),
      ),
    );
    return [...items, ...pages.flat()];
  },
  review: (id: number, status: "APPROVED" | "REJECTED") =>
    apiRequest<void>(`/account-deletion-requests/${id}`, {
      method: "PATCH",
      body: { status },
    }),
};

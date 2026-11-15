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

type AccountDeletionResponse = Omit<AccountDeletion, "name" | "createdAt"> & {
  fullName: string;
  requestedAt: string;
};
type DeletionItem = AccountDeletion | AccountDeletionResponse;
type AccountDeletionPage = {
  content: DeletionItem[];
  totalPages?: number;
};

function deletionItems(response: DeletionItem[] | AccountDeletionPage): AccountDeletion[] {
  const items = Array.isArray(response) ? response : response?.content;
  if (!Array.isArray(items))
    throw new Error("Formato inválido na resposta dos pedidos de exclusão.");
  return items.map((item) => ({
    ...item,
    name: "fullName" in item ? item.fullName : item.name,
    createdAt: "requestedAt" in item ? item.requestedAt : item.createdAt,
  }));
}

export const accountDeletionsApi = {
  list: async (status: AccountDeletion["status"], signal?: AbortSignal) => {
    const first = await apiRequest<DeletionItem[] | AccountDeletionPage>(
      "/account-deletion-requests" + queryString({ status }),
      { signal },
    );
    const items = deletionItems(first);
    if (Array.isArray(first)) return items;
    const pages = await Promise.all(
      Array.from({ length: Math.max(0, (first.totalPages ?? 1) - 1) }, (_, index) =>
        apiRequest<DeletionItem[] | AccountDeletionPage>(
          "/account-deletion-requests" + queryString({ status, page: index + 1 }),
          { signal },
        ).then(deletionItems),
      ),
    );
    return [...items, ...pages.flat()];
  },
  review: (id: number, status: "APPROVED" | "REJECTED", reason: string) =>
    apiRequest<void>(`/account-deletion-requests/${id}`, {
      method: "PATCH",
      body: { status, reason },
    }),
};

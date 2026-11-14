import { apiRequest } from "@/api/client";
export type Notification = {
  id: number | string;
  type: string;
  title?: string;
  message?: string;
  read?: boolean;
  readAt?: string | null;
  readUrl: string;
};
export const notificationsApi = {
  list: (signal?: AbortSignal) =>
    apiRequest<Notification[]>("/notifications", { signal }),
  read: (readUrl: string) => {
    const path = readUrl.startsWith("/api/") ? readUrl.slice(4) : readUrl;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("://"))
      throw new Error("URL de notificação inválida.");
    return apiRequest<void>(path, { method: "PATCH" });
  },
};

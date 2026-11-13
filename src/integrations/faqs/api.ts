import { apiRequest } from "@/api/client";

export type Faq = {
  id?: string | number;
  title: string;
  targetRole: string;
  message: string;
};

export const faqsApi = {
  remove: (id: string | number) =>
    apiRequest<void>("/faqs/" + encodeURIComponent(id), { method: "DELETE" }),
  list: (signal?: AbortSignal) => apiRequest<Faq[]>("/faqs", { signal }),
  create: (body: Pick<Faq, "title" | "targetRole" | "message">) =>
    apiRequest<Faq>("/faqs", { method: "POST", body }),
  update: (
    id: string | number,
    body: Pick<Faq, "title" | "targetRole" | "message">,
  ) =>
    apiRequest<Faq>("/faqs/" + encodeURIComponent(id), { method: "PUT", body }),
};

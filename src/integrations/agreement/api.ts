import { apiRequest } from "@/api/client";

export type DataAgreement = {
  version: number;
  title: string;
  content: string;
  accepted: boolean;
  acceptedAt: string | null;
};
export const agreementApi = {
  current: (signal?: AbortSignal) =>
    apiRequest<DataAgreement>("/schools/me/data-agreement", { signal }),
  accept: (version: number) =>
    apiRequest<DataAgreement>("/schools/me/data-agreement/accept", {
      method: "POST",
      body: { version, accepted: true },
    }),
};

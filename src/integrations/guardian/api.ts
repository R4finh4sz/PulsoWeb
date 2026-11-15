import { apiRequest, queryString } from "@/api/client";

export type GuardianStatus =
  | "AWAITING_SCHOOL_CHECK"
  | "CORRECTION_REQUESTED"
  | "AWAITING_GUARDIAN"
  | "EXPIRED"
  | "DECLINED"
  | "UNDER_REVIEW"
  | "CONFIRMED";
export type GuardianDecision = "CONFIRM" | "DECLINE" | "NOT_RECOGNIZED";
export type GuardianRelationship =
  | "MOTHER"
  | "FATHER"
  | "LEGAL_GUARDIAN"
  | "OTHER_LEGAL";
export type GuardianConfirmation = {
  id: number;
  registrationId: number;
  studentName: string;
  studentBirthDate: string | null;
  studentRa: string;
  schoolId: number;
  schoolName: string;
  guardianName: string;
  guardianEmail: string;
  status: GuardianStatus;
  correctionReason: string | null;
  correctionCount: number;
  resendCount: number;
  checkedById: number | null;
  checkedAt: string | null;
  checkMethod: string | null;
  invitationExpiresAt: string | null;
  lastDecision: GuardianDecision | null;
  createdAt: string;
};
export type GuardianInvitationView = {
  studentName: string;
  schoolName: string;
  purpose: string;
  expiresAt: string;
  terms: { version: string; title: string; content: string };
  privacy: { version: string; title: string; content: string };
  relationships: GuardianRelationship[];
};
export type GuardianCorrectionView = {
  studentName: string;
  schoolName: string;
  reason: string;
  expiresAt: string;
};

export const MAX_GUARDIAN_RESENDS = 3;
export const guardianStatusLabels: Record<GuardianStatus, string> = {
  AWAITING_SCHOOL_CHECK: "Aguardando conferência da escola",
  CORRECTION_REQUESTED: "Correção solicitada ao aluno",
  AWAITING_GUARDIAN: "Aguardando o responsável",
  CONFIRMED: "Responsável confirmou",
  UNDER_REVIEW: "Em análise",
  EXPIRED: "Convite expirado",
  DECLINED: "Responsável recusou",
};
export const guardianRelationshipLabels: Record<GuardianRelationship, string> =
  {
    MOTHER: "Mãe",
    FATHER: "Pai",
    LEGAL_GUARDIAN: "Tutor(a) legal",
    OTHER_LEGAL: "Outro responsável legal",
  };
export const guardianStatusLabel = (status: string) =>
  guardianStatusLabels[status as GuardianStatus] ?? status;
export const guardianRelationshipLabel = (value: string) =>
  guardianRelationshipLabels[value as GuardianRelationship] ?? value;

const enc = encodeURIComponent;
export const guardianApi = {
  list: (status: GuardianStatus, page = 0, signal?: AbortSignal, size = 20) =>
    apiRequest<{ content: GuardianConfirmation[]; totalPages: number }>(
      "/guardian-confirmations" + queryString({ status, page, size }),
      { signal },
    ),
  verify: (id: number, body: { method: string; justification?: string }) =>
    apiRequest<GuardianConfirmation>(`/guardian-confirmations/${id}/verify`, {
      method: "POST",
      body,
    }),
  requestCorrection: (id: number, reason: string) =>
    apiRequest<GuardianConfirmation>(
      `/guardian-confirmations/${id}/request-correction`,
      { method: "POST", body: { reason } },
    ),
  resend: (id: number) =>
    apiRequest<GuardianConfirmation>(`/guardian-confirmations/${id}/resend`, {
      method: "POST",
    }),
  invitation: (token: string, signal?: AbortSignal) =>
    apiRequest<GuardianInvitationView>(`/guardian-invitations/${enc(token)}`, {
      signal,
    }),
  decide: (
    token: string,
    body: {
      decision: GuardianDecision;
      relationship?: GuardianRelationship;
      declaration?: boolean;
      privacyAccepted?: boolean;
      privacyVersion?: string;
      termsVersion?: string;
    },
  ) =>
    apiRequest<{ decision: GuardianDecision; decidedAt: string }>(
      `/guardian-invitations/${enc(token)}/decision`,
      { method: "POST", body },
    ),
  correctionView: (token: string, signal?: AbortSignal) =>
    apiRequest<GuardianCorrectionView>(`/guardian-corrections/${enc(token)}`, {
      signal,
    }),
  correct: (token: string, body: { name: string; email: string }) =>
    apiRequest<{ status: GuardianStatus }>(
      `/guardian-corrections/${enc(token)}`,
      { method: "POST", body },
    ),
};

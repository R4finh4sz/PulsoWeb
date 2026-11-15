import { ApiError } from "@/api/client";
import type {
  GuardianConfirmation,
  GuardianStatus,
} from "@/integrations/guardian/api";

// Demo data for the guardian-confirmation flow (used only while mock access is enabled).
const DAY = 86_400_000;
const iso = (offset = 0) => new Date(Date.now() + offset).toISOString();
const agreement = {
  version: 1,
  title: "TERMO DE ADESÃO INSTITUCIONAL E TRATAMENTO DE DADOS",
  content:
    "Pelo presente termo, a escola declara que tratará os dados pessoais de alunos e responsáveis apenas para fins educacionais, conforme a LGPD.\n\nO tratamento de dados de menores depende da confirmação do responsável legal.",
  accepted: false,
  acceptedAt: null as string | null,
};
const base = {
  schoolId: 1,
  schoolName: "Escola Estadual Monte Serrat",
  correctionReason: null,
  correctionCount: 0,
  resendCount: 0,
  checkedById: null,
  checkedAt: null,
  checkMethod: null,
  invitationExpiresAt: null,
  lastDecision: null,
  createdAt: iso(-3 * DAY),
};
export const guardianConfirmations: GuardianConfirmation[] = [
  { ...base, id: 1, registrationId: 5102, studentName: "Mariana Lima", studentBirthDate: "2012-04-18", studentRa: "A102", guardianName: "Helena Lima", guardianEmail: "helena@exemplo.com", status: "AWAITING_SCHOOL_CHECK" },
  { ...base, id: 2, registrationId: 5103, studentName: "Pedro Oliveira", studentBirthDate: "2011-09-02", studentRa: "A103", guardianName: "Carlos Oliveira", guardianEmail: "carlos@exemplo.com", status: "AWAITING_GUARDIAN", resendCount: 3, checkedById: 2, checkedAt: iso(-2 * DAY), checkMethod: "Registro escolar", invitationExpiresAt: iso(4 * DAY) },
  { ...base, id: 3, registrationId: 5101, studentName: "Gabriel Santos", studentBirthDate: "2010-01-25", studentRa: "A101", guardianName: "Rosa Santos", guardianEmail: "rosa@exemplo.com", status: "CORRECTION_REQUESTED", correctionReason: "O e-mail informado não confere com o cadastro da escola.", correctionCount: 1 },
];
export const demoBirthDates: Record<number, string> = {
  5100: "2004-03-10",
  5101: "2010-01-25",
  5102: "2012-04-18",
  5103: "2011-09-02",
};

const age = (birthDate: string) => (Date.now() - Date.parse(birthDate)) / (365.25 * DAY);
const find = (id: number) => {
  const item = guardianConfirmations.find((entry) => entry.id === id);
  if (!item) throw new ApiError(404, "Confirmação não encontrada.");
  return item;
};
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function mockAgreementRequest(method: string, action: string | undefined, body: Record<string, unknown>) {
  if (method === "POST" && action === "accept") {
    if (body.accepted !== true) throw new ApiError(400, "É necessário aceitar o termo de adesão.");
    if (body.version !== agreement.version)
      throw new ApiError(409, "O termo de adesão institucional e tratamento de dados foi atualizado. Leia a nova versão antes de aceitar.");
    agreement.accepted = true;
    agreement.acceptedAt = iso();
  }
  return clone(agreement);
}

export function mockGuardianConfirmations(method: string, parts: string[], search: URLSearchParams, body: Record<string, unknown>) {
  if (method === "GET") {
    const status = (search.get("status") ?? "AWAITING_SCHOOL_CHECK") as GuardianStatus;
    const content = guardianConfirmations.filter((item) => item.status === status);
    return clone({ content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0 });
  }
  const item = find(Number(parts[1]));
  const action = parts[2];
  if (action === "verify") {
    if (!String(body.method ?? "").trim()) throw new ApiError(400, "Informe o método de conferência.");
    Object.assign(item, { status: "AWAITING_GUARDIAN", checkedById: 2, checkedAt: iso(), checkMethod: body.method, invitationExpiresAt: iso(7 * DAY) });
  } else if (action === "request-correction") {
    if (!String(body.reason ?? "").trim()) throw new ApiError(400, "Informe o motivo.");
    Object.assign(item, { status: "CORRECTION_REQUESTED", correctionReason: body.reason, correctionCount: item.correctionCount + 1 });
  } else if (action === "resend") {
    if (item.resendCount >= 3) throw new ApiError(409, "Limite de reenvios atingido.");
    Object.assign(item, { status: "AWAITING_GUARDIAN", resendCount: item.resendCount + 1, invitationExpiresAt: iso(7 * DAY) });
  }
  return clone(item);
}

/** Rules the backend enforces when approving a student. */
export function mockCheckStudentApproval(registrationId: number, identityChecked: unknown) {
  if (!agreement.accepted)
    throw new ApiError(409, "O coordenador precisa aceitar o termo de adesão institucional e tratamento de dados da escola antes de aprovar cadastros.");
  if (identityChecked !== true)
    throw new ApiError(400, "Confirme a conferência de nome, RA e data de nascimento.");
  const status = guardianConfirmations.find((item) => item.registrationId === registrationId)?.status;
  if (status && status !== "CONFIRMED")
    throw new ApiError(409, "Aguardando a confirmação do responsável legal do aluno.");
}

export function mockCorrectBirthDate(registrationId: number, current: { name: string; ra: string }, body: Record<string, unknown>) {
  const birthDate = String(body.birthDate ?? "");
  if (Number.isNaN(Date.parse(birthDate))) throw new ApiError(400, "Data de nascimento inválida.");
  if (age(birthDate) < 15) throw new ApiError(400, "O aluno precisa ter pelo menos 15 anos.");
  if (!String(body.reason ?? "").trim()) throw new ApiError(400, "Informe o motivo da correção.");
  demoBirthDates[registrationId] = birthDate;
  const index = guardianConfirmations.findIndex((item) => item.registrationId === registrationId);
  if (age(birthDate) >= 18) {
    if (index >= 0) guardianConfirmations.splice(index, 1);
  } else if (index < 0) {
    guardianConfirmations.push({
      ...base, id: Math.max(0, ...guardianConfirmations.map((item) => item.id)) + 1, registrationId,
      studentName: current.name, studentRa: current.ra, studentBirthDate: birthDate,
      guardianName: "", guardianEmail: "", status: "CORRECTION_REQUESTED",
      correctionReason: "Informe o contato do responsável legal.", createdAt: iso(),
    });
  } else guardianConfirmations[index].studentBirthDate = birthDate;
  return birthDate;
}

// Public links: "demo-<confirmationId>" tokens work; anything else behaves like an expired link.
function byToken(token: string) {
  const match = /^demo-(\d+)$/.exec(token);
  const item = match && guardianConfirmations.find((entry) => entry.id === Number(match[1]));
  if (!item) throw new ApiError(404, "indisponível");
  return item;
}
export function mockGuardianPublic(path: string, method: string, body: Record<string, unknown>) {
  const [, kind, token, action] = path.split("/");
  const item = byToken(decodeURIComponent(token));
  if (kind === "guardian-invitations") {
    if (action === "decision" && method === "POST") {
      if (body.decision === "CONFIRM" && (!body.relationship || body.declaration !== true || !body.termsVersion || body.privacyAccepted !== true || !body.privacyVersion))
        throw new ApiError(400, "Informe o parentesco e aceite a declaração.");
      const map = { CONFIRM: "CONFIRMED", DECLINE: "DECLINED", NOT_RECOGNIZED: "UNDER_REVIEW" } as const;
      item.status = map[body.decision as keyof typeof map] ?? "UNDER_REVIEW";
      item.lastDecision = body.decision as GuardianConfirmation["lastDecision"];
      return { decision: body.decision, decidedAt: iso() };
    }
    if (item.status !== "AWAITING_GUARDIAN") throw new ApiError(404, "indisponível");
    return {
      studentName: item.studentName, schoolName: item.schoolName,
      purpose: "Autorizar o tratamento de dados do aluno menor de idade na plataforma Pulso Escolar.",
      expiresAt: item.invitationExpiresAt ?? iso(7 * DAY),
      terms: { version: "1", title: "Termo do responsável legal", content: "Autorizo o tratamento dos dados pessoais do aluno pela escola, para fins exclusivamente educacionais, nos termos da LGPD." },
      privacy: { version: "1.0", title: "Politica de privacidade", content: "Politica de privacidade de teste." }, relationships: ["MOTHER", "FATHER", "LEGAL_GUARDIAN", "OTHER_LEGAL"],
    };
  }
  if (method === "POST") {
    if (!body.name || !body.email) throw new ApiError(400, "Informe nome e e-mail.");
    Object.assign(item, { guardianName: body.name, guardianEmail: body.email, status: "AWAITING_SCHOOL_CHECK" });
    return { status: item.status };
  }
  if (item.status !== "CORRECTION_REQUESTED") throw new ApiError(404, "indisponível");
  return { studentName: item.studentName, schoolName: item.schoolName, reason: item.correctionReason, expiresAt: iso(7 * DAY) };
}

import { classroomLabel } from "@/utils/classroomLabel";
import { buildClassroomReports, reportMetrics } from "@/utils/teacherReports";
import type { Faq } from "@/integrations/faqs/api";
import type { AccountDeletion } from "@/integrations/profile/deletions";
import type { Registration } from "@/integrations/registration/api";
import type { School, SchoolInvitation } from "@/integrations/schools/api";
import {
  MAX_SUBJECTS,
  type SubjectInvitation,
} from "@/integrations/subjects/api";
import type { Classroom, Subject, User } from "@/integrations/types";
import { canAccessSubject } from "@/utils/subjectAccess";
import { CreateSubjectSchema } from "@/validation/Subject.validation";
import { z } from "zod";
import { demoUsers, getDemoUser } from "./access";
import { demoSchoolInvitations, demoSubjectInvitations } from "./notifications";
import { mockPassword } from "./platform";
import {
  mockDeleteClassroomQuizzes,
  mockQuizStudents,
  mockRankingTotals,
  mockSubjectQuizzes,
  mockTeacherQuizzes,
} from "./quizzes";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const users: User[] = clone(demoUsers);
users.push(
  ...["Ricardo Almeida", "Fernanda Lima", "Carlos Oliveira"].map(
    (fullName, index): User => ({
      id: 6 + index,
      fullName,
      email: `docente${index + 1}@exemplo.com`,
      ra: `P00${6 + index}`,
      role: "TEACHER",
      classroomId: null,
      schoolId: 1,
    }),
  ),
);
const passwords = new Map<number, string>();
const faqs: Faq[] = [];
const revokedTerms = new Set<number>();
const deletionRequests = new Map<
  number,
  AccountDeletion & { schoolId: number | null }
>();
const deletedAccountIds = new Set<number>();
const registrations: Registration[] = [
  ...["Paula Mendes", "Lucas Ferreira", "Juliana Costa", "Rafael Almeida"].map(
    (name, index): Registration => ({
      id: 5000 + index,
      name,
      email: `professor${index + 1}@exemplo.com`,
      ra: `P${100 + index}`,
      birthDate: null,
      role: "TEACHER",
      schoolName: "Escola Estadual Monte Serrat",
      status: "PENDING",
      reviewReason: null,
      hasPhoto: false,
    }),
  ),
  ...["Beatriz Souza", "Gabriel Santos", "Mariana Lima", "Pedro Oliveira"].map(
    (name, index): Registration => ({
      id: 5100 + index,
      name,
      email: `estudante${index + 1}@exemplo.com`,
      ra: `A${100 + index}`,
      birthDate: null,
      role: "STUDENT",
      schoolName: "Escola Estadual Monte Serrat",
      status: "PENDING",
      reviewReason: null,
      hasPhoto: false,
    }),
  ),
];
const studentNames = [
  "Beatriz",
  "Bruno",
  "Camila",
  "Daniel",
  "Eduarda",
  "Felipe",
  "Gabriela",
  "Henrique",
  "Isabela",
  "João",
  "Larissa",
  "Lucas",
  "Mariana",
];
users.push(
  ...Array.from({ length: 39 }, (_, index): User => ({
    id: 100 + index,
    fullName: `${studentNames[index % studentNames.length]} ${["Santos", "Oliveira", "Souza"][Math.floor(index / studentNames.length)]}`,
    email: `aluno${index + 2}@exemplo.com`,
    ra: String(index + 2).padStart(5, "0"),
    role: "STUDENT",
    classroomId: 1,
    schoolId: 1,
  })),
);
const rooms: Classroom[] = [
  {
    id: 1,
    name: "1º ano A",
    identifier: "1A",
    teacherIds: [3, 5, 6, 7, 8],
    schoolId: 1,
  },
  { id: 2, name: "2º ano B", identifier: "2B", teacherIds: [3], schoolId: 2 },
  { id: 3, name: "3º ano A", identifier: "3A", teacherIds: [3], schoolId: 3 },
  { id: 4, name: "1º ano B", identifier: "1B", teacherIds: [3], schoolId: 1 },
  { id: 5, name: "1º ano C", identifier: "1C", teacherIds: [3], schoolId: 1 },
  { id: 6, name: "2º ano A", identifier: "2A", teacherIds: [3], schoolId: 1 },
  { id: 7, name: "2º ano B", identifier: "2B", teacherIds: [3], schoolId: 1 },
  { id: 8, name: "2º ano C", identifier: "2C", teacherIds: [3], schoolId: 1 },
  { id: 9, name: "3º ano A", identifier: "3A", teacherIds: [3], schoolId: 1 },
  { id: 10, name: "3º ano B", identifier: "3B", teacherIds: [3], schoolId: 1 },
  { id: 11, name: "3º ano C", identifier: "3C", teacherIds: [3], schoolId: 1 },
  { id: 12, name: "3º ano D", identifier: "3D", teacherIds: [3], schoolId: 1 },
];
const subjects: Subject[] = [
  {
    id: 1,
    name: "Matemática",
    classroomId: 1,
    teacherId: 3,
    teacherIds: [3, 6, 7],
  },
  { id: 2, name: "Ciências", classroomId: 1, teacherId: 5, teacherIds: [5, 7] },
  {
    id: 11,
    name: "Química",
    classroomId: 1,
    teacherId: 5,
    teacherIds: [5, 6, 7],
  },
  {
    id: 14,
    name: "Filosofia",
    classroomId: 1,
    teacherId: 3,
    teacherIds: [3, 8],
  },
];

// Turmas adicionais para explorar relatórios com diferentes volumes de alunos.
for (const [classroomId, count] of [
  [2, 32],
  [3, 28],
  [4, 35],
  [6, 24],
]) {
  const room = rooms.find((item) => item.id === classroomId)!;
  subjects.push({
    id: 100 + classroomId,
    name: "Matemática",
    classroomId,
    teacherId: 3,
    teacherIds: [3],
  });
  users.push(
    ...Array.from({ length: count }, (_, index): User => ({
      id: 1000 + classroomId * 100 + index,
      fullName: `${studentNames[(index + classroomId) % studentNames.length]} ${["Almeida", "Costa", "Pereira"][Math.floor(index / studentNames.length)]}`,
      email: `turma${classroomId}.aluno${index + 1}@exemplo.com`,
      ra: `${classroomId}${String(index + 1).padStart(4, "0")}`,
      role: "STUDENT",
      classroomId,
      schoolId: room.schoolId,
    })),
  );
}
const subjectInvitations: SubjectInvitation[] = clone(demoSubjectInvitations);
const schoolInvitations: SchoolInvitation[] = clone(demoSchoolInvitations);
const schools: School[] = [
  {
    id: 1,
    nome: "Escola Demonstração",
    logradouro: "Rua das Flores, 100",
    bairro: "Centro",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01001000",
    coordinator: {
      id: 2,
      fullName: demoUsers[1].fullName,
      email: demoUsers[1].email,
    },
  },
];
let terms = {
  title: "Termos de demonstração",
  version: "demo-1",
  content: "Ambiente local com dados fictícios para explorar o Pulso Escolar.",
};

schools[0] = {
  ...schools[0],
  nome: "Escola Estadual Monte Serrat",
  teacherIds: [3, 5, 6, 7, 8],
};
schools.push(
  {
    ...schools[0],
    id: 2,
    nome: "Escola Estadual Jardim das Flores",
    teacherIds: [3],
  },
  { ...schools[0], id: 3, nome: "Escola Estadual Vila Nova", teacherIds: [3] },
  {
    ...schools[0],
    id: 4,
    nome: "Escola Estadual Parque das Árvores",
    teacherIds: [],
  },
);

for (const id of [6, 100]) {
  const user = users.find((item) => item.id === id)!;
  deletionRequests.set(id, {
    id,
    name: user.fullName,
    email: user.email,
    role: user.role as "TEACHER" | "STUDENT",
    schoolId: user.schoolId ?? null,
    reason:
      id === 6
        ? "Não faço mais parte da equipe da escola."
        : "Não utilizarei mais esta conta.",
    createdAt: new Date().toISOString(),
    status: "PENDING",
  });
}

// Dados mantidos apenas na memória da aba; recarregar restaura os exemplos.
const profilePhotos = new Map<string | number, Blob>();
export function mockRequest(
  path: string,
  method: string,
  body: unknown,
  token: string,
): unknown {
  const current = getDemoUser(token);
  if (!current || deletedAccountIds.has(current.id))
    throw new Error("Sessão de demonstração inválida.");
  if (path === "/me/photo") {
    if (method === "GET") return profilePhotos.get(current.id);
    if (method === "PUT") {
      const photo = body instanceof FormData ? body.get("photo") : null;
      if (!(photo instanceof Blob) || !photo.type.startsWith("image/"))
        throw new Error("Selecione um arquivo de imagem.");
      profilePhotos.set(current.id, photo);
      return;
    }
  }
  const url = new URL(path, "http://mock.local");
  const parts = url.pathname.split("/").filter(Boolean);
  const data = (body ?? {}) as Record<string, unknown>;
  if (path === "/auth/password" && method === "PATCH")
    return mockRequest(
      "/me/password",
      "PUT",
      { ...data, confirmPassword: data.newPassword },
      token,
    );
  if (path === "/me/deletion-requests" && method === "POST")
    return mockRequest("/me/deletion-request", method, body, token);
  if (parts[0] === "faqs") {
    if (method === "GET" && !parts[1])
      return clone(
        faqs.filter(
          (faq) => current.role === "ADMIN" || faq.targetRole === current.role,
        ),
      );
    if (current.role !== "ADMIN")
      throw new Error("Somente administradores podem editar o FAQ.");
    if (method === "DELETE" && parts[1]) {
      const index = faqs.findIndex((faq) => String(faq.id) === decodeURIComponent(parts[1]));
      if (index < 0) throw new Error("Pergunta não encontrada.");
      faqs.splice(index, 1);
      return;
    }
    if (method === "POST" || method === "PUT") {
      const input = z
        .object({
          title: z.string().trim().min(1).max(200),
          message: z.string().trim().min(1).max(5000),
          targetRole: z.enum(["TEACHER", "PEDAGOGICAL_COORDINATOR", "STUDENT"]),
        })
        .parse(data);
      if (method === "POST" && !parts[1]) {
        const faq = { id: faqs.length + 1, ...input };
        faqs.push(faq);
        return clone(faq);
      }
      const faq = faqs.find((faq) => String(faq.id) === parts[1]);
      if (!faq) throw new Error("Pergunta não encontrada.");
      Object.assign(faq, input);
      return clone(faq);
    }
    throw new Error("Operação de FAQ indisponível na demonstração.");
  }
  if (path === "/auth/2fa" && method === "PATCH") {
    if (
      typeof data.enabled !== "boolean" ||
      data.currentPassword !== (passwords.get(current.id) ?? mockPassword)
    )
      throw new Error("Senha atual incorreta.");
    if (current.role === "ADMIN" && !data.enabled)
      throw new Error(
        "A verificação em duas etapas é obrigatória para administradores.",
      );
    return;
  }
  if (path === "/auth/password" && method === "PATCH")
    return mockRequest(
      "/me/password",
      "PUT",
      { ...data, confirmPassword: data.newPassword },
      token,
    );
  if (path === "/me/deletion-requests" && method === "POST")
    return mockRequest("/me/deletion-request", method, body, token);
  if (url.pathname === "/admin/metrics" && method === "GET") {
    if (current.role !== "ADMIN")
      throw new Error(
        "Métricas técnicas disponíveis apenas para administradores.",
      );
    // shortcut: demo does not run a backend, keep technical samples empty until real telemetry is available.
    return { current: null, history: [] };
  }
  if (url.pathname === "/schools/me/metrics/growth" && method === "GET") {
    const year = Number(url.searchParams.get("year"));
    if (!Number.isInteger(year) || year < 1 || year > 9999)
      throw new Error("Informe um ano válido.");
    const metrics = mockRequest(
      "/schools/me/metrics",
      "GET",
      undefined,
      token,
    ) as import("@/integrations/metrics/api").SchoolMetrics;
    // shortcut: demo users have no registration dates, add dated fixtures when demo needs growth history.
    return {
      schoolId: metrics.schoolId,
      schoolName: metrics.schoolName,
      year,
      months: Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        students: 0,
        teachers: 0,
        cumulativeStudents: 0,
        cumulativeTeachers: 0,
      })),
      averageMonthlyStudents: 0,
      averageMonthlyTeachers: 0,
      studentsWithoutRegistrationDate: metrics.bigNumbers.students,
      teachersWithoutRegistrationDate: metrics.bigNumbers.teachers,
    };
  }
  if (path === "/schools/me/metrics" && method === "GET") {
    if (current.role !== "PEDAGOGICAL_COORDINATOR" || !current.schoolId)
      throw new Error("Coordenador sem escola ativa autorizada.");
    const classrooms = rooms.filter(
      (room) => room.schoolId === current.schoolId,
    );
    const schoolSubjects = subjects.filter((subject) =>
      classrooms.some((room) => room.id === subject.classroomId),
    );
    return {
      schoolId: current.schoolId,
      schoolName: schools.find((school) => school.id === current.schoolId)
        ?.nome,
      bigNumbers: {
        students: users.filter(
          (user) =>
            user.role === "STUDENT" && user.schoolId === current.schoolId,
        ).length,
        teachers: users.filter(
          (user) =>
            user.role === "TEACHER" &&
            (user.schoolIds ?? [user.schoolId]).includes(current.schoolId),
        ).length,
        classrooms: classrooms.length,
        subjects: schoolSubjects.length,
        activities: 0,
        submissions: 0,
      },
    };
  }
  if (url.pathname === "/rankings/students" && method === "GET") {
    // shortcut: demo has no historical submissions, add period fixtures when demo needs history.
    return [];
  }
  if (path === "/me") return { ...current };
  if (url.pathname === "/ranking" && method === "GET") {
    if (current.role === "STUDENT")
      throw new Error("Alunos não têm acesso ao ranking na plataforma web.");
    const admin = current.role === "ADMIN";
    const allowedSchools = schools.filter(
      (school) =>
        admin ||
        (current.role === "TEACHER"
          ? school.teacherIds?.includes(current.id)
          : (current.schoolIds ?? [current.schoolId]).includes(school.id)),
    );
    const schoolId = url.searchParams.get("schoolId") || "";
    const grade = url.searchParams.get("grade") || "";
    const classroomId = url.searchParams.get("classroomId") || "";
    const classroomIdentifier =
      url.searchParams.get("classroomIdentifier") || "";
    if (
      classroomIdentifier &&
      (!schoolId || !/^[A-Z]$/.test(classroomIdentifier))
    )
      throw new Error(
        "Selecione uma escola autorizada e um identificador de A a Z.",
      );
    if (
      schoolId &&
      !allowedSchools.some((school) => String(school.id) === schoolId)
    )
      throw new Error("Você não tem acesso ao ranking desta escola.");
    if (grade && !schoolId && !admin)
      throw new Error(
        "Selecione uma escola à qual você tem acesso para filtrar por série.",
      );
    if (
      classroomId &&
      (!schoolId ||
        !rooms.some(
          (room) =>
            String(room.id) === classroomId &&
            String(room.schoolId) === schoolId,
        ))
    )
      throw new Error("Selecione uma turma da escola autorizada.");
    // Calendário exclusivamente demonstrativo: janelas de dois meses.
    // Em produção, o backend deve usar as datas do calendário escolar.
    const now = new Date();
    const month = Math.floor(now.getMonth() / 2) * 2;
    const start = new Date(now.getFullYear(), month, 1);
    const end = new Date(now.getFullYear(), month + 2, 1);
    const totals = mockRankingTotals(users, start.getTime(), end.getTime());
    const gradeOf = (name: string) => name.replace(/\s+[A-Za-z]$/, "");
    const entries = users
      .filter((user) => user.role === "STUDENT")
      .flatMap((student) => {
        const room = rooms.find((room) => room.id === student.classroomId);
        const school = schools.find((school) => school.id === room?.schoolId);
        const total = totals.get(student.id);
        if (!room || !school || !total) return [];
        if (schoolId && String(school.id) !== schoolId) return [];
        if (grade && gradeOf(room.name) !== grade) return [];
        if (classroomId && String(room.id) !== classroomId) return [];
        if (
          classroomIdentifier &&
          room.name.trim().match(/[A-Za-z]+$/)?.[0] !== classroomIdentifier
        )
          return [];
        return [
          {
            studentId: student.id,
            name: student.fullName,
            schoolId: school.id,
            schoolName: school.nome,
            grade: admin || schoolId ? gradeOf(room.name) : null,
            classroomName: schoolId ? room.name : null,
            classroomIdentifier: schoolId ? room.identifier : null,
            ...total,
          },
        ];
      });
    return {
      period: {
        label: `${start.toLocaleDateString("pt-BR")} a ${new Date(end.getTime() - 1).toLocaleDateString("pt-BR")}`,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      },
      schools: allowedSchools.map((school) => ({
        id: school.id,
        name: school.nome,
      })),
      grades:
        admin || schoolId
          ? [
              ...new Set(
                rooms
                  .filter(
                    (room) => !schoolId || String(room.schoolId) === schoolId,
                  )
                  .map((room) => gradeOf(room.name)),
              ),
            ].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }))
          : [],
      canFilterGlobalGrades: admin,
      classrooms: schoolId
        ? rooms
            .filter((room) => String(room.schoolId) === schoolId)
            .map((room) => ({
              id: room.id,
              name: room.name,
              grade: gradeOf(room.name),
            }))
        : [],
      entries,
    };
  }
  if (
    parts[0] === "school-invitations" ||
    (parts[0] === "me" && parts[1] === "school-invitations")
  ) {
    if (parts[0] === "me") parts.shift();
    if (current.role !== "TEACHER")
      throw new Error(
        "Somente professores podem responder convites de escolas.",
      );
    if (method === "GET" && !parts[1])
      return clone(
        schoolInvitations.filter(
          (invite) =>
            invite.email === current.email.toLowerCase() &&
            invite.status === "PENDING",
        ),
      );
    const invite = schoolInvitations.find(
      (invite) =>
        invite.id === Number(parts[1]) &&
        invite.email === current.email.toLowerCase(),
    );
    if (!invite)
      throw new Error("Convite de escola não encontrado para este professor.");
    if (
      method !== "PATCH" ||
      (data.status !== "ACCEPTED" && data.status !== "REJECTED")
    )
      throw new Error("Informe ACCEPTED ou REJECTED.");
    if (invite.status !== "PENDING")
      throw new Error("Este convite já foi respondido.");
    const school = schools.find((school) => school.id === invite.schoolId);
    if (!school) throw new Error("Escola não encontrada.");
    if (data.status === "ACCEPTED")
      school.teacherIds = [
        ...new Set([...(school.teacherIds ?? []), current.id]),
      ];
    invite.status = data.status;
    return clone(invite);
  }
  if (parts[0] === "subject-invitations") {
    if (current.role !== "TEACHER")
      throw new Error(
        "Somente professores podem responder convites de matérias.",
      );
    if (method === "GET" && !parts[1])
      return clone(
        subjectInvitations.filter(
          (invite) =>
            invite.email === current.email.toLowerCase() &&
            invite.status === "PENDING",
        ),
      );
    const invite = subjectInvitations.find(
      (invite) =>
        invite.id === Number(parts[1]) &&
        invite.email === current.email.toLowerCase(),
    );
    if (!invite) throw new Error("Convite não encontrado para este professor.");
    if (
      method !== "PATCH" ||
      (data.status !== "ACCEPTED" && data.status !== "REJECTED")
    )
      throw new Error("Informe ACCEPTED ou REJECTED.");
    if (invite.status !== "PENDING")
      throw new Error("Este convite já foi respondido.");
    const subject = subjects.find((subject) => subject.id === invite.subjectId);
    const room = rooms.find((room) => room.id === subject?.classroomId);
    if (!subject || !room) throw new Error("Matéria não encontrada.");
    if (data.status === "ACCEPTED") {
      subject.teacherIds = [
        ...new Set([
          subject.teacherId,
          ...(subject.teacherIds ?? []),
          current.id,
        ]),
      ];
      room.teacherIds = [...new Set([...room.teacherIds, current.id])];
      const school = schools.find((school) => school.id === room.schoolId);
      if (school)
        school.teacherIds = [
          ...new Set([...(school.teacherIds ?? []), current.id]),
        ];
    }
    invite.status = data.status;
    return clone(invite);
  }
  if (parts[0] === "me" && parts[1]) {
    if (
      current.role !== "TEACHER" &&
      current.role !== "PEDAGOGICAL_COORDINATOR" &&
      !(
        current.role === "ADMIN" &&
        ["profile", "export", "password"].includes(parts[1])
      ) &&
      !(current.role === "STUDENT" && parts[1] === "deletion-request")
    )
      throw new Error(
        "Perfil disponível apenas para professores e coordenadores.",
      );
    const profile = {
      user: current,
      schools: schools.filter(
        (school) =>
          (current.role === "TEACHER" &&
            school.teacherIds?.includes(current.id)) ||
          school.id === current.schoolId,
      ),
      classrooms: rooms.filter((room) =>
        current.role === "TEACHER"
          ? room.teacherIds.includes(current.id)
          : room.schoolId === current.schoolId,
      ),
      deletionRequested: deletionRequests.get(current.id)?.status === "PENDING",
    };
    if (parts[1] === "profile" && method === "GET") return clone(profile);
    if (parts[1] === "export" && method === "GET")
      return clone({
        exportedAt: new Date().toISOString(),
        ...profile,
        quizzes:
          current.role === "TEACHER"
            ? mockTeacherQuizzes(current, subjects)
            : [],
        invitations: subjectInvitations.filter((invitation) =>
          subjects.some(
            (subject) =>
              subject.id === invitation.subjectId &&
              subject.teacherId === current.id,
          ),
        ),
      });
    if (parts[1] === "password" && method === "PUT") {
      if (data.currentPassword !== (passwords.get(current.id) ?? mockPassword))
        throw new Error("A senha atual está incorreta.");
      const password = data.newPassword;
      if (
        typeof password !== "string" ||
        password.length < 8 ||
        new TextEncoder().encode(password).length > 72 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      )
        throw new Error(
          "Use pelo menos 8 caracteres, incluindo letras e números.",
        );
      if (password !== data.confirmPassword)
        throw new Error("A confirmação de senha não confere.");
      if (password === data.currentPassword)
        throw new Error("Escolha uma senha diferente da atual.");
      passwords.set(current.id, password);
      return undefined;
    }
    if (parts[1] === "deletion-request" && method === "POST") {
      if (data.currentPassword !== (passwords.get(current.id) ?? mockPassword))
        throw new Error("A senha atual está incorreta.");
      if (typeof data.reason !== "string" || !data.reason.trim())
        throw new Error("Informe o motivo da exclusão.");
      const reason = data.reason.trim();
      if (reason.length > 2000)
        throw new Error("O motivo deve ter no máximo 2000 caracteres.");
      if (deletionRequests.get(current.id)?.status === "PENDING")
        throw new Error("Já existe um pedido de exclusão pendente.");
      if (current.role !== "TEACHER" && current.role !== "STUDENT")
        throw new Error("Esta solicitação é destinada a alunos e professores.");
      deletionRequests.set(current.id, {
        id: current.id,
        name: current.fullName,
        email: current.email,
        role: current.role,
        schoolId: current.schoolId ?? null,
        reason,
        createdAt: new Date().toISOString(),
        status: "PENDING",
      });
      return undefined;
    }
  }
  if (
    parts[0] === "teacher" &&
    parts[1] === "activities" &&
    parts[3] === "results" &&
    method === "GET"
  ) {
    const quiz = mockTeacherQuizzes(current, subjects).find(
      (quiz) => quiz.id === Number(parts[2]),
    );
    if (!quiz)
      throw new Error("Quiz não encontrado ou não vinculado ao seu perfil.");
    const subject = subjects.find((subject) => subject.id === quiz.subjectId);
    const room = rooms.find((room) => room.id === quiz.classroomId);
    return clone({
      quiz: {
        ...quiz,
        subjectName: subject?.name ?? "Matéria",
        classroomName: classroomLabel(room) || "Turma",
        schoolName:
          schools.find((school) => school.id === room?.schoolId)?.nome ??
          "Escola",
      },
      students: mockQuizStudents(quiz, users),
    });
  }
  if (path === "/teacher/classrooms" && method === "GET") {
    if (current.role !== "TEACHER")
      throw new Error("Acesso exclusivo de professores.");
    return clone(
      rooms
        .filter((room) => room.teacherIds.includes(current.id))
        .map((room) => ({
          ...room,
          schoolName:
            schools.find((school) => school.id === room.schoolId)?.nome ?? null,
        })),
    );
  }
  if (url.pathname === "/teacher/reports" && method === "GET") {
    const results = mockTeacherQuizzes(current, subjects)
      .filter((quiz) => {
        const room = rooms.find((room) => room.id === quiz.classroomId);
        return (
          (!url.searchParams.has("schoolId") ||
            room?.schoolId === Number(url.searchParams.get("schoolId"))) &&
          (!url.searchParams.has("classroomId") ||
            quiz.classroomId === Number(url.searchParams.get("classroomId"))) &&
          (url.searchParams.get("status") !== "FINISHED" ||
            quiz.status === "CLOSED")
        );
      })
      .map((quiz) => {
        const room = rooms.find((room) => room.id === quiz.classroomId);
        return {
          quiz: {
            ...quiz,
            subjectName:
              subjects.find((subject) => subject.id === quiz.subjectId)?.name ??
              "Disciplina",
            classroomName: classroomLabel(room) || "Turma",
            schoolName:
              schools.find((school) => school.id === room?.schoolId)?.nome ??
              "Escola",
          },
          students: mockQuizStudents(quiz, users),
        };
      });
    const reports = buildClassroomReports(results);
    const metrics = reportMetrics(reports.flatMap((room) => room.students));
    const summary = {
      averageGrade: metrics.average,
      expectedSubmissions: metrics.assigned,
      submittedCount: metrics.submitted,
      completionPercentage: metrics.completion,
      studentsWithOverdue: metrics.attention,
      recipientHistoryComplete: true,
    };
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        ...summary,
        classroomCount: reports.length,
        activityCount: results.length,
      },
      classrooms: reports.map((room) => ({
        classroomId: room.id,
        classroomName: classroomLabel(room),
        schoolId: rooms.find((item) => item.id === room.id)?.schoolId ?? null,
        schoolName: room.school,
        studentCount: room.students.length,
        activityCount: room.activities,
        averageGrade: room.average,
        expectedSubmissions: room.assigned,
        submittedCount: room.submitted,
        completionPercentage: room.completion,
        studentsWithOverdue: room.attention,
        recipientHistoryComplete: true,
      })),
    };
  }
  if (path === "/teacher/activities" && method === "GET")
    return clone(
      mockTeacherQuizzes(current, subjects).map((quiz) => {
        const subject = subjects.find(
          (subject) => subject.id === quiz.subjectId,
        );
        const room = rooms.find((room) => room.id === quiz.classroomId);
        return {
          ...quiz,
          subjectName: subject?.name ?? "Matéria",
          classroomName: classroomLabel(room) || "Turma",
          schoolName:
            schools.find((school) => school.id === room?.schoolId)?.nome ??
            "Escola",
        };
      }),
    );
  if (path === "/auth/logout") return undefined;
  if (path === "/terms/accepted")
    return revokedTerms.has(current.id) ? [] : [terms.version];
  if (path === "/terms/accept" && method === "POST") {
    revokedTerms.delete(current.id);
    return undefined;
  }
  if (path === "/terms/revoke" && method === "POST") {
    revokedTerms.add(current.id);
    return undefined;
  }
  if (path === "/terms") {
    if (method !== "GET") terms = { ...terms, ...data };
    return { ...terms };
  }
  if (parts[0] === "schools") {
    if (parts[1] === "search" && method === "GET") {
      const cep = url.searchParams.get("cep")?.replace(/\D/g, "");
      const q = (url.searchParams.get("q") ?? "").toLocaleLowerCase("pt-BR");
      const page = Number(url.searchParams.get("page") ?? 0);
      const size = Number(url.searchParams.get("size") ?? 20);
      const results = schools.filter(
        (school) =>
          (!cep || school.cep?.replace(/\D/g, "") === cep) &&
          school.nome.toLocaleLowerCase("pt-BR").includes(q),
      );
      return {
        content: results
          .slice(page * size, (page + 1) * size)
          .map((school) => ({
            id: String(school.id),
            name: school.nome,
            city: school.cidade,
            state: school.uf ?? "",
            cep: school.cep ?? null,
          })),
        page,
        size,
        totalElements: results.length,
        totalPages: Math.ceil(results.length / size),
      };
    }

    if (method === "POST") {
      const school = { ...data, id: schools.length + 1 } as School;
      schools.push(school);
      return clone(school);
    }
    return clone(schools);
  }
  if (parts[0] === "account-deletion-requests") {
    if (current.role !== "ADMIN" && current.role !== "PEDAGOGICAL_COORDINATOR")
      throw new Error(
        "Você não tem permissão para analisar exclusões de conta.",
      );
    const accessible = [...deletionRequests.values()].filter(
      (request) =>
        current.role === "ADMIN" || request.schoolId === current.schoolId,
    );
    if (method === "GET" && !parts[1])
      return clone(
        accessible.filter(
          (request) =>
            request.status === (url.searchParams.get("status") ?? "PENDING"),
        ),
      );
    const request = accessible.find((item) => item.id === Number(parts[1]));
    if (method !== "PATCH" || !request)
      throw new Error("Pedido de exclusão não encontrado.");
    if (request.status !== "PENDING")
      throw new Error("Este pedido já foi analisado.");
    if (data.status !== "APPROVED" && data.status !== "REJECTED")
      throw new Error("Informe uma decisão válida.");
    request.status = data.status;
    if (data.status === "APPROVED") {
      deletedAccountIds.add(request.id);
      const index = users.findIndex((user) => user.id === request.id);
      if (index >= 0) users.splice(index, 1);
      for (const room of rooms)
        room.teacherIds = room.teacherIds.filter((id) => id !== request.id);
      for (const school of schools)
        school.teacherIds = school.teacherIds?.filter(
          (id) => id !== request.id,
        );
      for (const subject of subjects) {
        subject.teacherIds = (subject.teacherIds ?? [subject.teacherId]).filter(
          (id) => id !== request.id,
        );
        if (subject.teacherId === request.id)
          subject.teacherId = subject.teacherIds[0] ?? 0;
      }
    }
    return undefined;
  }
  if (parts[0] === "registration-requests") {
    if (current.role !== "ADMIN" && current.role !== "PEDAGOGICAL_COORDINATOR")
      throw new Error("Você não tem permissão para analisar cadastros.");
    const schoolName = schools.find(
      (school) => school.id === current.schoolId,
    )?.nome;
    const accessible = registrations.filter(
      (request) =>
        current.role === "ADMIN" || request.schoolName === schoolName,
    );
    if (method === "GET" && !parts[1]) {
      const status = url.searchParams.get("status") ?? "PENDING";
      const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
      const size = Math.max(1, Number(url.searchParams.get("size")) || 20);
      const filtered = accessible.filter(
        (request) => request.status === status,
      );
      return clone({
        content: filtered.slice(page * size, (page + 1) * size),
        totalPages: Math.ceil(filtered.length / size),
      });
    }
    if (method === "PATCH" && parts[1]) {
      const request = accessible.find((item) => item.id === Number(parts[1]));
      if (!request) throw new Error("Solicitação não encontrada.");
      if (request.status !== "PENDING")
        throw new Error("Esta solicitação já foi analisada.");
      if (data.status !== "APPROVED" && data.status !== "REJECTED")
        throw new Error("Informe uma decisão válida.");
      request.status = data.status;
      request.reviewReason =
        typeof data.reason === "string" ? data.reason : null;
      if (request.status === "APPROVED")
        users.push({
          id: request.id,
          fullName: request.name,
          email: request.email,
          ra: request.ra,
          role: request.role,
          classroomId: null,
          schoolId: schools.find((school) => school.nome === request.schoolName)
            ?.id,
        });
      return clone(request);
    }
  }
  if (parts[0] === "invitations" && method === "POST") return undefined;
  const role = {
    students: "STUDENT",
    teachers: "TEACHER",
    coordinators: "PEDAGOGICAL_COORDINATOR",
  }[parts[0]];
  if (role) {
    const id = Number(parts[1]);
    if (method === "POST") {
      const user = {
        ...data,
        id: Math.max(...users.map((user) => user.id)) + 1,
        role,
        classroomId: null,
        schoolId: 1,
      } as User;
      users.push(user);
      return { ...user };
    }
    if (id) {
      const user = users.find((user) => user.id === id && user.role === role);
      if (!user) throw new Error("Cadastro não encontrado no mock.");
      if (method === "PATCH") {
        if (
          current.role === "PEDAGOGICAL_COORDINATOR" &&
          (parts[0] === "students" || parts[0] === "teachers")
        )
          throw new Error(
            "O coordenador não pode editar os dados de alunos ou professores.",
          );
        Object.assign(user, data);
      }
      return { ...user };
    }
    const q = (url.searchParams.get("q") ?? "").toLocaleLowerCase();
    const filtered = users.filter(
      (user) =>
        user.role === role &&
        `${user.fullName} ${user.email} ${user.ra}`
          .toLocaleLowerCase()
          .includes(q) &&
        (!url.searchParams.has("classroomId") ||
          user.classroomId === Number(url.searchParams.get("classroomId"))) &&
        (url.searchParams.get("unassigned") !== "true" ||
          user.classroomId === null),
    );
    const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
    const size = Math.max(1, Number(url.searchParams.get("size")) || 20);
    return clone({
      content: filtered.slice(page * size, (page + 1) * size),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    });
  }
  if (parts[0] === "classrooms") {
    if (parts.length === 1) {
      if (method === "POST") {
        const room: Classroom = {
          name: String(data.name),
          identifier: String(data.identifier),
          id: Math.max(0, ...rooms.map((room) => room.id)) + 1,
          teacherIds: [],
        };
        rooms.push(room);
        return { ...room };
      }
      return clone(
        rooms.filter((room) =>
          current.role === "TEACHER"
            ? room.teacherIds.includes(current.id)
            : current.role === "STUDENT"
              ? room.id === current.classroomId
              : true,
        ),
      );
    }
    const room = rooms.find((room) => room.id === Number(parts[1]));
    if (!room) throw new Error("Turma não encontrada no mock.");
    if (parts[2] === "subjects") {
      if (parts[3]) {
        const subject = subjects.find(
          (subject) =>
            subject.id === Number(parts[3]) && subject.classroomId === room.id,
        );
        if (!subject || !room.teacherIds.includes(current.id))
          throw new Error(
            "Matéria não encontrada ou não vinculada ao seu perfil.",
          );
        if (parts[4] === "invitations" && method === "POST") {
          if (current.role !== "TEACHER" || subject.teacherId !== current.id)
            throw new Error(
              "Você não pode convidar professores para esta matéria.",
            );
          const parsed = z
            .email()
            .safeParse(
              typeof data.email === "string"
                ? data.email.trim().toLowerCase()
                : "",
            );
          if (!parsed.success) throw new Error("Informe um e-mail válido.");
          if (
            users.some(
              (user) =>
                user.email.toLowerCase() === parsed.data &&
                user.role !== "TEACHER",
            )
          )
            throw new Error("O convite deve ser enviado a um professor.");
          if (
            users.some(
              (user) =>
                user.email.toLowerCase() === parsed.data &&
                canAccessSubject(subject, user.id),
            )
          )
            throw new Error("Você já faz parte desta matéria.");
          if (
            subjectInvitations.some(
              (invite) =>
                invite.subjectId === subject.id &&
                invite.email === parsed.data &&
                invite.status === "PENDING",
            )
          )
            throw new Error("Já existe um convite pendente para este e-mail.");
          const invitation: SubjectInvitation = {
            id: subjectInvitations.length + 1,
            subjectId: subject.id,
            email: parsed.data,
            status: "PENDING",
            classroomId: room.id,
            subjectName: subject.name,
            inviterName: current.fullName,
          };
          subjectInvitations.push(invitation);
          return clone(invitation);
        }
        if (!canAccessSubject(subject, current.id))
          throw new Error("Aceite o convite para acessar esta matéria.");
        if (
          parts.length === 5 &&
          parts[4] === "syllabus" &&
          method === "PATCH"
        ) {
          if (current.role !== "TEACHER")
            throw new Error(
              "Somente professores da disciplina podem editar a ementa.",
            );
          const parsed = CreateSubjectSchema.parse(data);
          subject.name = parsed.name;
          subject.syllabus = parsed.syllabus;
          subject.topics = parsed.topics;
          return clone(subject);
        }
        return mockSubjectQuizzes(subject, current, parts[4], method, body);
      }
      if (method === "POST") {
        if (current.role !== "TEACHER" || !room.teacherIds.includes(current.id))
          throw new Error(
            "Somente um professor vinculado pode criar matérias.",
          );
        if (
          subjects.filter((subject) => subject.classroomId === room.id)
            .length >= MAX_SUBJECTS
        )
          throw new Error("Esta turma já possui o limite de 7 matérias.");
        const name = typeof data.name === "string" ? data.name.trim() : "";
        if (!name || name.length > 100)
          throw new Error("Informe um nome de matéria com até 100 caracteres.");
        const content =
          data.topics !== undefined || data.syllabus !== undefined
            ? CreateSubjectSchema.parse(data)
            : {};
        const subject: Subject = {
          id: Math.max(0, ...subjects.map((item) => item.id)) + 1,
          name,
          classroomId: room.id,
          teacherId: current.id,
          teacherIds: [current.id],
          ...content,
        };
        subjects.push(subject);
        return { ...subject };
      }
      return clone(
        subjects.filter(
          (subject) =>
            subject.classroomId === room.id &&
            (current.role !== "TEACHER" ||
              room.teacherIds.includes(current.id)),
        ),
      );
    }
    if (parts[2]) {
      const teacher = parts[2] === "teachers";
      const person = users.find((user) => user.id === Number(parts[3]));
      if (parts[3] && person) {
        if (teacher)
          room.teacherIds =
            method === "DELETE"
              ? room.teacherIds.filter((id) => id !== person.id)
              : [...new Set([...room.teacherIds, person.id])];
        else person.classroomId = method === "DELETE" ? null : room.id;
        return method === "DELETE" ? undefined : clone(teacher ? room : person);
      }
      return clone(
        users.filter((user) =>
          teacher
            ? room.teacherIds.includes(user.id)
            : user.classroomId === room.id,
        ),
      );
    }
    if (method === "DELETE") {
      if (
        current.role !== "ADMIN" &&
        !(
          current.role === "PEDAGOGICAL_COORDINATOR" &&
          current.schoolId === room.schoolId
        )
      )
        throw new Error("Você não tem permissão para excluir esta turma.");
      for (const student of users)
        if (student.classroomId === room.id) student.classroomId = null;
      for (let index = subjectInvitations.length - 1; index >= 0; index--) {
        if (subjectInvitations[index].classroomId === room.id)
          subjectInvitations.splice(index, 1);
      }
      for (let index = subjects.length - 1; index >= 0; index--) {
        if (subjects[index].classroomId === room.id) subjects.splice(index, 1);
      }
      mockDeleteClassroomQuizzes(room.id);
      rooms.splice(rooms.indexOf(room), 1);
      return undefined;
    }
    if (method === "PATCH") Object.assign(room, data);
    return clone(room);
  }
  if (parts[0] === "subjects") return [];
  throw new Error(
    `Esta ação ainda não está disponível no mock: ${method} ${url.pathname}`,
  );
}

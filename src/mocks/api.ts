import { demoSubjectInvitations } from "./notifications";
import { canAccessSubject } from "@/utils/subjectAccess";
import type { Classroom, Subject, User } from "@/integrations/types";
import type { School } from "@/integrations/schools/api";
import { demoUsers, getDemoUser } from "./access";
import {
  mockSubjectQuizzes,
  mockTeacherQuizzes,
  mockQuizStudents,
} from "./quizzes";
import {
  MAX_SUBJECTS,
  type SubjectInvitation,
} from "@/integrations/subjects/api";
import { z } from "zod";
import { mockPassword } from "./platform";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const users: User[] = clone(demoUsers);
const passwords = new Map<number, string>();
const deletionRequests = new Map<number, { reason: string }>();
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
  { id: 1, name: "6º ano A", identifier: "6A", teacherIds: [3, 5], schoolId: 1 },
  { id: 2, name: "7º ano B", identifier: "7B", teacherIds: [3], schoolId: 2 },
  { id: 3, name: "8º ano A", identifier: "8A", teacherIds: [3], schoolId: 3 },
  { id: 4, name: "6º ano B", identifier: "6B", teacherIds: [3], schoolId: 1 },
  { id: 5, name: "6º ano C", identifier: "6C", teacherIds: [3], schoolId: 1 },
  { id: 6, name: "7º ano A", identifier: "7A", teacherIds: [3], schoolId: 1 },
  { id: 7, name: "7º ano B", identifier: "7B", teacherIds: [3], schoolId: 1 },
  { id: 8, name: "7º ano C", identifier: "7C", teacherIds: [3], schoolId: 1 },
  { id: 9, name: "8º ano A", identifier: "8A", teacherIds: [3], schoolId: 1 },
  { id: 10, name: "8º ano B", identifier: "8B", teacherIds: [3], schoolId: 1 },
  { id: 11, name: "9º ano A", identifier: "9A", teacherIds: [3], schoolId: 1 },
  { id: 12, name: "9º ano B", identifier: "9B", teacherIds: [3], schoolId: 1 },
];
const subjects: Subject[] = [
  { id: 1, name: "Matemática", classroomId: 1, teacherId: 3, teacherIds: [3] },
  { id: 2, name: "Ciências", classroomId: 1, teacherId: 5, teacherIds: [5] },
];
const subjectInvitations: SubjectInvitation[] = clone(demoSubjectInvitations);
const schools: School[] = [
  {
    id: 1,
    nome: "Escola Demonstração",
    cnpj: "11222333000181",
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

schools[0] = { ...schools[0], nome: "EMEF Monte Serrat", teacherIds: [3, 5] };
schools.push(
  { ...schools[0], id: 2, nome: "EMEF Jardim das Flores", teacherIds: [3] },
  { ...schools[0], id: 3, nome: "EMEF Vila Nova", teacherIds: [3] },
);

// Dados mantidos apenas na memória da aba; recarregar restaura os exemplos.
export function mockRequest(
  path: string,
  method: string,
  body: unknown,
  token: string,
): unknown {
  const current = getDemoUser(token);
  if (!current) throw new Error("Sessão de demonstração inválida.");
  const url = new URL(path, "http://mock.local");
  const parts = url.pathname.split("/").filter(Boolean);
  const data = (body ?? {}) as Record<string, unknown>;
  if (path === "/me") return { ...current };
  if (parts[0] === "subject-invitations") {
    if (current.role !== "TEACHER")
      throw new Error("Somente professores podem responder convites de matérias.");
    if (method === "GET" && !parts[1])
      return clone(subjectInvitations.filter((invite) =>
        invite.email === current.email.toLowerCase() && invite.status === "PENDING",
      ));
    const invite = subjectInvitations.find((invite) =>
      invite.id === Number(parts[1]) && invite.email === current.email.toLowerCase(),
    );
    if (!invite) throw new Error("Convite não encontrado para este professor.");
    if (method !== "PATCH" || (data.status !== "ACCEPTED" && data.status !== "REJECTED"))
      throw new Error("Informe ACCEPTED ou REJECTED.");
    if (invite.status !== "PENDING") throw new Error("Este convite já foi respondido.");
    const subject = subjects.find((subject) => subject.id === invite.subjectId);
    const room = rooms.find((room) => room.id === subject?.classroomId);
    if (!subject || !room) throw new Error("Matéria não encontrada.");
    if (data.status === "ACCEPTED") {
      subject.teacherIds = [...new Set([subject.teacherId, ...(subject.teacherIds ?? []), current.id])];
      room.teacherIds = [...new Set([...room.teacherIds, current.id])];
      const school = schools.find((school) => school.id === room.schoolId);
      if (school) school.teacherIds = [...new Set([...(school.teacherIds ?? []), current.id])];
    }
    invite.status = data.status;
    return clone(invite);
  }
  if (parts[0] === "me" && parts[1]) {
    if (current.role !== "TEACHER")
      throw new Error("Perfil disponível apenas para professores.");
    const profile = {
      user: current,
      schools: schools.filter(
        (school) =>
          school.teacherIds?.includes(current.id) ||
          school.id === current.schoolId,
      ),
      classrooms: rooms.filter((room) => room.teacherIds.includes(current.id)),
      deletionRequested: deletionRequests.has(current.id),
    };
    if (parts[1] === "profile" && method === "GET") return clone(profile);
    if (parts[1] === "export" && method === "GET")
      return clone({
        exportedAt: new Date().toISOString(),
        ...profile,
        quizzes: mockTeacherQuizzes(current, subjects),
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
        !/[A-Za-z]/.test(password) ||
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
      if (deletionRequests.has(current.id))
        throw new Error("Já existe um pedido de exclusão pendente.");
      deletionRequests.set(current.id, { reason });
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
        classroomName: room?.name ?? "Turma",
        schoolName:
          schools.find((school) => school.id === room?.schoolId)?.nome ??
          "Escola",
      },
      students: mockQuizStudents(quiz, users),
    });
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
          classroomName: room?.name ?? "Turma",
          schoolName:
            schools.find((school) => school.id === room?.schoolId)?.nome ??
            "Escola",
        };
      }),
    );
  if (path === "/auth/logout") return undefined;
  if (path === "/terms/accepted") return [terms.version];
  if (path === "/terms/accept") return undefined;
  if (path === "/terms") {
    if (method !== "GET") terms = { ...terms, ...data };
    return { ...terms };
  }
  if (parts[0] === "schools") {
    if (method === "POST") {
      const school = { ...data, id: schools.length + 1 } as School;
      schools.push(school);
      return clone(school);
    }
    return clone(schools);
  }
  if (parts[0] === "registration-requests" && method === "GET")
    return { content: [], totalPages: 0 };
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
      if (method === "PATCH") Object.assign(user, data);
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
          if (users.some((user) => user.email.toLowerCase() === parsed.data && user.role !== "TEACHER"))
            throw new Error("O convite deve ser enviado a um professor.");
          if (users.some((user) => user.email.toLowerCase() === parsed.data && canAccessSubject(subject, user.id)))
            throw new Error("Você já faz parte desta matéria.");
          if (
            subjectInvitations.some(
              (invite) =>
                invite.subjectId === subject.id && invite.email === parsed.data && invite.status === "PENDING",
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
        const subject = {
          id: subjects.length + 1,
          name,
          classroomId: room.id,
          teacherId: current.id,
          teacherIds: [current.id],
        };
        subjects.push(subject);
        return { ...subject };
      }
      return clone(
        subjects.filter(
          (subject) =>
            subject.classroomId === room.id &&
            (current.role !== "TEACHER" || room.teacherIds.includes(current.id)),
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
    if (method === "PATCH") Object.assign(room, data);
    return clone(room);
  }
  if (parts[0] === "subjects") return [];
  throw new Error(
    `Esta ação ainda não está disponível no mock: ${method} ${url.pathname}`,
  );
}

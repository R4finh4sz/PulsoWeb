/* eslint-disable @typescript-eslint/no-require-imports -- Runner CommonJS para carregar os serviços TS sem dependências adicionais. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const { test } = require("node:test");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const { authService } = require("../src/services/auth.ts");
const { getSchoolsForUser, getClassroomsForUser, getSubjectsForUser } = require("../src/services/dashboard.ts");
const { mockUsers, mockPassword } = require("../src/mocks/platform.ts");
const { LoginSchema } = require("../src/validation/Login.validation.ts");
const { homeRoutes } = require("../src/interfaces/auth.ts");
const { createClassroom } = require("../src/services/classrooms.ts");
const { ClassroomSchema } = require("../src/validation/Classroom.validation.ts");
const { classrooms } = require("../src/mocks/platform.ts");

const newRoom = { year: "2", identifier: "c", schoolId: "school-1", teacherIds: ["teacher-1"], period: "Manhã" };

test("turma valida ano e identificador, normalizando a letra", () => {
  assert.equal(ClassroomSchema.parse(newRoom).identifier, "C");
  for (const year of ["", "0", "10", "a", "1.5"]) {
    assert.equal(ClassroomSchema.safeParse({ ...newRoom, year }).success, false);
  }
  for (const identifier of ["", "AB", "1", "!"]) {
    assert.equal(ClassroomSchema.safeParse({ ...newRoom, identifier }).success, false);
  }
  assert.equal(ClassroomSchema.safeParse({ ...newRoom, teacherIds: [] }).success, false);
});

test("criação vincula professor e atualiza a seleção de turmas por perfil", () => {
  const room = createClassroom(mockUsers[1], newRoom, classrooms);
  assert.equal(room.name, "2º ano C");
  assert.equal(room.students, 0);
  assert.deepEqual(room.teacherIds, ["teacher-1"]);
  const allRooms = [...classrooms, room];
  assert.ok(getClassroomsForUser(mockUsers[1], allRooms).some((item) => item.id === room.id));
  assert.ok(getClassroomsForUser(mockUsers[2], allRooms).some((item) => item.id === room.id));
  assert.equal(getClassroomsForUser({ ...mockUsers[2], id: "other-teacher" }, allRooms).length, 0);
  assert.throws(() => createClassroom(mockUsers[1], newRoom, allRooms), /Já existe/);
});

test("criação rejeita escola não vinculada, perfil e professor inválidos", () => {
  assert.throws(() => createClassroom(mockUsers[0], newRoom, classrooms), /coordenação/);
  assert.throws(() => createClassroom(mockUsers[2], newRoom, classrooms), /coordenação/);
  assert.throws(() => createClassroom(mockUsers[1], { ...newRoom, schoolId: "school-2" }, classrooms), /coordenação/);
  assert.throws(() => createClassroom(mockUsers[1], { ...newRoom, teacherIds: ["admin-1"] }, classrooms), /professor válido/);
  assert.throws(() => createClassroom(mockUsers[1], { ...newRoom, year: "3", identifier: "B" }, classrooms), /Já existe/);
});

test("as contas válidas seguem o destino do seu perfil", () => {
  for (const account of mockUsers) {
    const user = authService.login({ email: account.email, password: mockPassword });
    assert.equal(user.role, account.role);
    assert.equal(homeRoutes[user.role], "/" + account.role);
    assert.equal("password" in user, false);
  }
});

test("turma permite vários professores e rejeita vínculos duplicados ou inválidos", () => {
  const input = { ...newRoom, teacherIds: ["teacher-1", "teacher-2"] };
  const room = createClassroom(mockUsers[1], input, classrooms);
  assert.deepEqual(room.teacherIds, input.teacherIds);
  for (const id of input.teacherIds) {
    const teacher = mockUsers.find((user) => user.id === id);
    assert.ok(getClassroomsForUser(teacher, [...classrooms, room]).some((item) => item.id === room.id));
  }
  assert.equal(ClassroomSchema.safeParse({ ...newRoom, teacherIds: ["teacher-1", "teacher-1"] }).success, false);
  assert.throws(() => createClassroom(mockUsers[1], { ...newRoom, teacherIds: ["teacher-1", "admin-1"] }, classrooms));
});

test("credenciais incorretas são rejeitadas", () => {
  assert.throws(() => authService.login({ email: "admin@pulso.com", password: "errada" }));
  assert.throws(() => authService.login({ email: "aluno@pulso.com", password: mockPassword }));
});

test("e-mail aceita espaços nas extremidades e letras maiúsculas", () => {
  assert.equal(authService.login({ email: " ADMIN@PULSO.COM ", password: mockPassword }).role, "admin");
});

test("validação rejeita campos vazios e e-mail inválido", () => {
  assert.equal(LoginSchema.safeParse({ email: "", password: "" }).success, false);
  assert.equal(LoginSchema.safeParse({ email: "invalido", password: mockPassword }).success, false);
});

test("admin vê escolas com e sem coordenador", () => {
  const schools = getSchoolsForUser(mockUsers[0]);
  assert.equal(schools.length, 2);
  assert.ok(schools.some((school) => school.coordinatorId === null));
});

test("coordenador vê somente sua escola e suas turmas", () => {
  const user = mockUsers[1];
  assert.deepEqual(getSchoolsForUser(user).map((school) => school.id), ["school-1"]);
  assert.equal(getClassroomsForUser(user).length, 3);
  assert.equal(getClassroomsForUser({ ...user, id: "coordinator-without-school" }).length, 0);
});

test("professor não vê turma sem designação nem conteúdos de outro professor", () => {
  const user = mockUsers[2];
  assert.deepEqual(getClassroomsForUser(user).map((room) => room.id), ["class-1", "class-2"]);
  assert.equal(getSubjectsForUser(user).length, 2);
  assert.ok(getSubjectsForUser(user).every((subject) => subject.teacherId === user.id));
  assert.equal(getClassroomsForUser({ ...user, id: "teacher-without-class" }).length, 0);
  assert.equal(getSubjectsForUser({ ...user, id: "teacher-without-class" }).length, 0);
});

test("adicionar professores preserva vínculos e permite acesso ao novo professor", () => {
  const { addClassroomTeachers } = require("../src/services/classrooms.ts");
  const updated = addClassroomTeachers(mockUsers[1], "class-1", ["teacher-2"], classrooms);
  assert.deepEqual(updated.find((room) => room.id === "class-1").teacherIds, ["teacher-1", "teacher-2"]);
  assert.deepEqual(classrooms.find((room) => room.id === "class-1").teacherIds, ["teacher-1"]);
  const teacher = mockUsers.find((user) => user.id === "teacher-2");
  assert.ok(getClassroomsForUser(teacher, updated).some((room) => room.id === "class-1"));
  const repeated = addClassroomTeachers(mockUsers[1], "class-1", ["teacher-2"], updated);
  assert.equal(repeated.find((room) => room.id === "class-1").teacherIds.length, 2);
  assert.throws(() => addClassroomTeachers(mockUsers[2], "class-1", ["teacher-2"], classrooms));
  assert.throws(() => addClassroomTeachers({ ...mockUsers[1], id: "other" }, "class-1", ["teacher-2"], classrooms));
  assert.throws(() => addClassroomTeachers(mockUsers[1], "missing", ["teacher-2"], classrooms));
  assert.throws(() => addClassroomTeachers(mockUsers[1], "class-1", ["admin-1"], classrooms));
  assert.throws(() => addClassroomTeachers(mockUsers[1], "class-1", [], classrooms));
});

test("remoção preserva os demais vínculos e revoga acesso somente à turma removida", () => {
  const { removeClassroomTeacher } = require("../src/services/classrooms.ts");
  const updated = removeClassroomTeacher(mockUsers[1], "class-1", "teacher-1", classrooms);
  assert.deepEqual(updated.find((room) => room.id === "class-1").teacherIds, []);
  assert.deepEqual(classrooms.find((room) => room.id === "class-1").teacherIds, ["teacher-1"]);
  assert.deepEqual(getClassroomsForUser(mockUsers[2], updated).map((room) => room.id), ["class-2"]);
  assert.ok(getSubjectsForUser(mockUsers[2], updated).every((subject) => subject.classroomId !== "class-1"));
  assert.throws(() => removeClassroomTeacher(mockUsers[2], "class-1", "teacher-1", classrooms));
  assert.throws(() => removeClassroomTeacher({ ...mockUsers[1], id: "other" }, "class-1", "teacher-1", classrooms));
  assert.throws(() => removeClassroomTeacher(mockUsers[1], "missing", "teacher-1", classrooms));
  const multiple = classrooms.map((room) => room.id === "class-1" ? { ...room, teacherIds: ["teacher-1", "teacher-2"] } : room);
  assert.deepEqual(removeClassroomTeacher(mockUsers[1], "class-1", "teacher-2", multiple)[0].teacherIds, ["teacher-1"]);
});

test("cadastro de escola valida campos, CNPJ e duplicidade", () => {
  const { createSchool } = require("../src/services/schools.ts");
  const { SchoolSchema, isValidCnpj } = require("../src/validation/School.validation.ts");
  const form = { name: "Escola Nova", cnpj: "11.222.333/0001-81", street: "Rua das Flores", state: "SP", city: "Campinas", coordinatorId: "coordinator-1" };
  assert.equal(isValidCnpj(form.cnpj), true);
  assert.equal(isValidCnpj("00.000.000/E08G-12"), true);
  for (const cnpj of ["00000000000000", "11.222.333/0001-80", "123", "11@222333000181"]) assert.equal(isValidCnpj(cnpj), false);
  for (const field of Object.keys(form)) assert.equal(SchoolSchema.safeParse({ ...form, [field]: "" }).success, false);
  assert.equal(SchoolSchema.safeParse({ ...form, state: "XX" }).success, false);
  const school = createSchool(mockUsers[0], form, []);
  assert.equal(school.cnpj, "11222333000181");
  assert.equal(school.coordinatorId, "coordinator-1");
  assert.equal(school.city, "Campinas");
  assert.equal(school.street, "Rua das Flores");
  assert.throws(() => createSchool(mockUsers[0], { ...form, cnpj: school.cnpj }, [school]), /Já existe/);
  assert.throws(() => createSchool(mockUsers[1], form, []), /administrador/);
});

test("escola exige um coordenador válido e libera a criação de turmas para ele", () => {
  const { createSchool } = require("../src/services/schools.ts");
  const { SchoolSchema } = require("../src/validation/School.validation.ts");
  const form = { name: "Escola Teste", cnpj: "11222333000181", street: "Rua Teste", state: "SP", city: "Campinas", coordinatorId: "coordinator-1" };
  assert.equal(SchoolSchema.safeParse({ ...form, coordinatorId: ["coordinator-1", "coordinator-2"] }).success, false);
  assert.throws(() => createSchool(mockUsers[0], { ...form, coordinatorId: "teacher-1" }, []));
  const school = createSchool(mockUsers[0], form, []);
  assert.deepEqual(getSchoolsForUser(mockUsers[1], [], [school]), [school]);
  const room = createClassroom(mockUsers[1], { ...newRoom, schoolId: school.id }, [], [school]);
  assert.deepEqual(getClassroomsForUser(mockUsers[1], [room], [school]), [room]);
  assert.throws(() => createClassroom({ ...mockUsers[1], id: "other" }, { ...newRoom, schoolId: school.id }, [], [school]));
});

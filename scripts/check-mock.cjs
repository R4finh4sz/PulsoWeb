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

test("as três contas válidas têm destinos distintos", () => {
  for (const account of mockUsers) {
    const user = authService.login({ email: account.email, password: mockPassword });
    assert.equal(user.role, account.role);
    assert.equal(homeRoutes[user.role], "/" + account.role);
    assert.equal("password" in user, false);
  }
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

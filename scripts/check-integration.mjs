import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function integration(file, responses) {
  const calls = [];
  const cache = new Map();
  const session = { accessToken: "teacher-token" };
  function load(path) {
    if (cache.has(path)) return cache.get(path);
    const exports = {};
    cache.set(path, exports);
    const compiled = ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(compiled, {
      exports, Headers, FormData, URLSearchParams, DOMException,
      require: (name) => {
        if (name.includes("state")) return { useAuthState: { getState: () => ({ session }) } };
        if (name === "./config") return { API_BASE_URL: "/api" };
        if (name === "@/api/client") return load("src/api/client.ts");
        throw new Error(`Unexpected dependency: ${name}`);
      },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const response = responses.shift();
        assert.ok(response, "Unexpected request");
        return response;
      },
    });
    return exports;
  }
  return { api: load(file), calls };
}

test("active school and teacher classrooms use authenticated backend endpoints", async () => {
  for (const [file, name, invoke, url, method] of [
    ["auth", "authApi", api => api.activeSchool(2), "/api/me/active-school", "PATCH"],
    ["classrooms", "classroomsApi", api => api.teacherList(), "/api/teacher/classrooms", "GET"],
  ]) {
    const { api, calls } = integration(`src/integrations/${file}/api.ts`, [new Response(null, { status: 204 })]);
    await invoke(api[name]);
    assert.equal(calls[0].url, url);
    assert.equal(calls[0].options.method, method);
    assert.equal(calls[0].options.headers.get("Authorization"), "Bearer teacher-token");
    if (method === "PATCH") assert.deepEqual(JSON.parse(calls[0].options.body), { schoolId: 2 });
  }
});

test("users normalize arrays and reject malformed backend responses", async () => {
  const { api } = integration("src/integrations/users/api.ts", [Response.json([{ id: 1 }]), Response.json({ invalid: true })]);
  const page = await api.usersApi.list("teachers");
  assert.equal(page.totalElements, 1);
  assert.equal(page.content[0].id, 1);
  await assert.rejects(api.usersApi.list("teachers"), /Formato/);
});

test("deletion requests collect every page and preserve the abort signal", async () => {
  const { api, calls } = integration("src/integrations/profile/deletions.ts", [
    Response.json({ content: [{ id: 1 }], totalPages: 2 }),
    Response.json({ content: [{ id: 2 }], totalPages: 2 }),
  ]);
  const signal = new AbortController().signal;
  const items = await api.accountDeletionsApi.list("PENDING", signal);
  assert.equal(items.length, 2);
  assert.equal(items[1].id, 2);
  assert.equal(calls[1].url, "/api/account-deletion-requests?status=PENDING&page=1");
  assert.equal(calls[1].options.signal, signal);
});

test("invitations send backend field names and retain delivery results", async () => {
  const { api, calls } = integration("src/integrations/registration/api.ts", [Response.json({ delivery: "INTERNAL" }), new Response(null, { status: 204 })]);
  assert.equal((await api.registrationApi.invite("teachers", { email: "teacher@test.com", schoolId: 2 })).delivery, "INTERNAL");
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: "teacher@test.com" });
  await api.registrationApi.complete("token", { name: "Teacher", ra: " 001 ", password: "secret", termsAccepted: true, termsVersion: "1" });
  assert.equal(JSON.parse(calls[1].options.body).matricula, "001");
  assert.equal(JSON.parse(calls[1].options.body).ra, undefined);
});

test("registration supports multipart photos and binary downloads", async () => {
  const { api, calls } = integration("src/integrations/registration/api.ts", [Response.json({ id: 1 }), new Response("photo")]);
  await api.registrationApi.register({ name: "Student" }, new Blob(["photo"], { type: "image/png" }));
  assert.ok(calls[0].options.body instanceof FormData);
  assert.equal(calls[0].options.headers.has("Content-Type"), false);
  assert.equal(await (await api.registrationApi.photo(1)).text(), "photo");
  assert.equal(calls[1].options.headers.get("Accept"), "image/png");
});

test("notifications normalize /api and reject external URLs", async () => {
  const { api, calls } = integration("src/integrations/notifications/api.ts", [new Response(null, { status: 204 })]);
  await api.notificationsApi.read("/api/school-invitations/9/read");
  assert.equal(calls[0].url, "/api/school-invitations/9/read");
  assert.equal(calls[0].options.method, "PATCH");
  assert.throws(() => api.notificationsApi.read("https://example.com/read"));
});

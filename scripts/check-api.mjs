import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function loadClient(fetch) {
  const source = fs.readFileSync("src/api/client.ts", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => ({ API_BASE_URL: "/api" }), fetch, Headers, URLSearchParams });
  return exports;
}
test("GET preserves the session cookie and needs no CSRF request", async () => {
  const calls = [];
  const api = loadClient(async (url, options) => { calls.push({ url, options }); return Response.json({ id: 1 }); });
  assert.equal((await api.apiRequest("/me")).id, 1);
  assert.equal(calls.length, 1); assert.equal(calls[0].url, "/api/me");
  assert.equal(calls[0].options.credentials, "include");
});
test("login sends JSON with the header returned by CSRF endpoint", async () => {
  const calls = [];
  const api = loadClient(async (url, options) => {
    calls.push({ url, options });
    return url.endsWith("/csrf") ? Response.json({ headerName: "X-CSRF-TOKEN", token: "token-1" }) : Response.json({ id: 3 });
  });
  await api.apiRequest("/auth/login", { method: "POST", body: { email: "a@example.com", password: "test" } });
  assert.equal(calls[0].url, "/api/csrf");
  assert.equal(calls[1].options.headers.get("X-CSRF-TOKEN"), "token-1");
  assert.equal(JSON.parse(calls[1].options.body).email, "a@example.com");
  assert.equal(calls[1].options.credentials, "include");
});
test("each write gets a new CSRF token, including after login", async () => {
  let version = 0;
  const tokens = [];
  const api = loadClient(async (url, options) => {
    if (url.endsWith("/csrf")) return Response.json({ headerName: "X-CSRF-TOKEN", token: String(++version) });
    tokens.push(options.headers.get("X-CSRF-TOKEN")); return Response.json({});
  });
  await api.apiRequest("/auth/login", { method: "POST", body: {} });
  await api.apiRequest("/students", { method: "POST", body: {} });
  assert.deepEqual(tokens, ["1", "2"]);
});
test("204 deletion does not attempt JSON parsing", async () => {
  const api = loadClient(async url => url.endsWith("/csrf") ? Response.json({ headerName: "X-CSRF-TOKEN", token: "x" }) : new Response(null, { status: 204 }));
  assert.equal(await api.apiRequest("/classrooms/1/students/2", { method: "DELETE" }), undefined);
});
test("server validation and SMTP errors remain actionable", async () => {
  const api = loadClient(async () => Response.json({ detail: "Não foi possível enviar o e-mail.", errors: ["email: inválido"] }, { status: 503 }));
  await assert.rejects(api.apiRequest("/me"), error => error.status === 503 && error.message.includes("e-mail") && error.errors.length === 1);
});
test("a rejected write is never replayed automatically", async () => {
  let writes = 0;
  const api = loadClient(async url => {
    if (url.endsWith("/csrf")) return Response.json({ headerName: "X-CSRF-TOKEN", token: "x" });
    writes++; return Response.json({ detail: "Sem permissão." }, { status: 403 });
  });
  await assert.rejects(api.apiRequest("/students", { method: "POST", body: {} }));
  assert.equal(writes, 1);
});
test("filters preserve zero and false, escape search, and omit missing values", () => {
  const api = loadClient();
  assert.equal(api.queryString({ q: "Ana & B", page: 0, unassigned: false, classroomId: undefined }), "?q=Ana+%26+B&page=0&unassigned=false");
});

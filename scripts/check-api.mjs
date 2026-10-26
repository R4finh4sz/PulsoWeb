import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function loadClient(fetch, initial = { accessToken: "teacher-token" }) {
  let session = initial;
  const state = { getState: () => ({ session, setSession: value => { session = value; } }) };
  const source = fs.readFileSync("src/api/client.ts", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: path => path.includes("state") ? { useAuthState: state } : { API_BASE_URL: "/api" }, fetch, Headers, FormData, URLSearchParams, DOMException });
  return { ...exports, state };
}
test("GET sends current Bearer token, omits old cookies and disables caching", async () => {
  const api = loadClient(async (url, options) => {
    assert.equal(url, "/api/me");
    assert.equal(options.headers.get("Authorization"), "Bearer teacher-token");
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    return Response.json({ id: 3 });
  });
  assert.equal((await api.apiRequest("/me")).id, 3);
});
test("login never sends previous credentials or requests CSRF", async () => {
  let calls = 0;
  const api = loadClient(async (url, options) => {
    calls++;
    assert.equal(url, "/api/auth/login");
    assert.equal(options.headers.get("Authorization"), null);
    assert.equal(JSON.parse(options.body).email, "teacher@example.com");
    return Response.json({ accessToken: "new-token" });
  });
  await api.apiRequest("/auth/login", { method: "POST", body: { email: "teacher@example.com", password: "test" } });
  assert.equal(calls, 1);
});
test("password reset requests are public and do not clear the current session", async () => {
  const api = loadClient(async (url, options) => {
    assert.equal(url, "/api/auth/password-reset/request");
    assert.equal(options.headers.get("Authorization"), null);
    return Response.json({}, { status: 401 });
  });
  await assert.rejects(api.apiRequest("/auth/password-reset/request", {
    method: "POST",
    body: { email: "teacher@example.com" },
  }));
  assert.deepEqual(api.state.getState().session, { accessToken: "teacher-token" });
});
test("password reset sends the backend reset payload", async () => {
  const api = loadClient(async (url, options) => {
    assert.equal(url, "/api/auth/password-reset/reset");
    assert.equal(options.headers.get("Authorization"), null);
    assert.deepEqual(JSON.parse(options.body), {
      email: "teacher@example.com",
      resetToken: "reset-token",
      newPassword: "NovaSenha123",
      confirmPassword: "NovaSenha123",
    });
    return new Response(null, { status: 204 });
  });
  await api.apiRequest("/auth/password-reset/reset", {
    method: "POST",
    body: {
      email: "teacher@example.com",
      resetToken: "reset-token",
      newPassword: "NovaSenha123",
      confirmPassword: "NovaSenha123",
    },
  });
});
test("204 works for verification and terms acceptance", async () => {
  const api = loadClient(async () => new Response(null, { status: 204 }));
  assert.equal(await api.apiRequest("/terms/accept", { method: "POST", body: { version: "1.0", termsAccepted: true } }), undefined);
});
test("late response from admin cannot populate teacher cache", async () => {
  let resolve;
  const api = loadClient(() => new Promise(done => { resolve = done; }), { accessToken: "admin" });
  const request = api.apiRequest("/me");
  api.state.getState().setSession({ accessToken: "teacher" });
  resolve(Response.json({ role: "ADMIN" }));
  await assert.rejects(request, error => error.name === "AbortError");
});
test("401 from an old account cannot clear the new session", async () => {
  let resolve;
  const api = loadClient(() => new Promise(done => { resolve = done; }));
  const request = api.apiRequest("/me");
  api.state.getState().setSession({ accessToken: "new-account" });
  resolve(Response.json({}, { status: 401 }));
  await assert.rejects(request);
  assert.equal(api.state.getState().session.accessToken, "new-account");
});
test("current session expires on 401", async () => {
  const api = loadClient(async () => Response.json({}, { status: 401 }));
  await assert.rejects(api.apiRequest("/me"));
  assert.equal(api.state.getState().session, null);
});
test("server errors are preserved and writes are not retried", async () => {
  let calls = 0;
  const api = loadClient(async () => { calls++; return Response.json({ detail: "Código inválido.", errors: ["code"] }, { status: 400 }); });
  await assert.rejects(api.apiRequest("/auth/2fa/verify", { method: "POST", body: { code: "123456" } }), error => error.message === "Código inválido." && error.errors.length === 1);
  assert.equal(calls, 1);
});
test("filters preserve zero and false and escape search", () => {
  assert.equal(loadClient().queryString({ q: "Ana & B", page: 0, unassigned: false, classroomId: undefined }), "?q=Ana+%26+B&page=0&unassigned=false");
});

test("registration photo uses multipart without overriding its boundary", async () => {
  const body = new FormData(); body.set("data", JSON.stringify({ name: "Aluno Teste" }));
  body.set("photo", new Blob(["photo"], { type: "image/png" }), "photo.png");
  const api = loadClient(async (url, options) => {
    assert.equal(url, "/api/auth/register");
    assert.equal(options.body, body);
    assert.equal(options.headers.get("Content-Type"), null);
    return Response.json({ id: 1, status: "PENDING" });
  }, null);
  assert.equal((await api.apiRequest("/auth/register", { method: "POST", body })).status, "PENDING");
});

test("registration photo download keeps Bearer authorization and returns a blob", async () => {
  const api = loadClient(async (url, options) => {
    assert.equal(url, "/api/registration-requests/1/photo");
    assert.equal(options.headers.get("Authorization"), "Bearer teacher-token");
    assert.equal(options.headers.get("Accept"), "image/png");
    return new Response("photo", { headers: { "Content-Type": "image/png" } });
  });
  const photo = await api.apiRequest("/registration-requests/1/photo", { responseType: "blob", headers: { Accept: "image/png" } });
  assert.equal(await photo.text(), "photo");
});

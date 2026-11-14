import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

class ApiError extends Error {
  constructor(status) { super("Request failed"); this.status = status; }
}
function loadAuth(apiRequest) {
  const source = fs.readFileSync("src/integrations/auth/api.ts", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => ({ apiRequest, ApiError }) });
  return exports.authApi;
}
test("unpublished terms return an empty state only for 404", async () => {
  assert.equal(await loadAuth(async () => { throw new ApiError(404); }).terms(), null);
  for (const status of [401, 403, 500]) {
    await assert.rejects(loadAuth(async () => { throw new ApiError(status); }).terms(), error => error.status === status);
  }
});
test("current terms are returned intact", async () => {
  const current = { title: "Termos", version: "v2", content: "Texto atual" };
  const signal = new AbortController().signal;
  const auth = loadAuth(async (path, options) => {
    assert.equal(path, "/terms");
    assert.equal(options.signal, signal);
    return current;
  });
  assert.equal(await auth.terms(signal), current);
});
test("creation and editing use the backend publishing contract", async () => {
  const methods = [];
  const body = { title: "Termos", content: "Conteúdo" };
  const auth = loadAuth(async (path, options) => {
    assert.equal(path, "/terms");
    assert.equal(options.body, body);
    methods.push(options.method);
    return { ...body, version: "v1" };
  });
  await auth.createTerms(body);
  await auth.updateTerms(body);
  assert.deepEqual(methods, ["POST", "PUT"]);
});

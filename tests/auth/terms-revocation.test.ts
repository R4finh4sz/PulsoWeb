jest.mock("@/mocks/access", () => ({
  ...jest.requireActual("@/mocks/access"),
  mockAccessEnabled: true,
}));
import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";
import { createDemoSession, demoUsers } from "@/mocks/access";

afterEach(() => useAuthState.getState().setSession(null));

test("mock exige novo aceite após revogar e mantém os aceites de outras contas", async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  const terms = (await authApi.terms())!;
  expect(await authApi.accepted()).toContain(terms.version);
  await authApi.revokeTerms();
  expect(await authApi.accepted()).toEqual([]);
  useAuthState.getState().setSession(createDemoSession(demoUsers[1]));
  expect(await authApi.accepted()).toContain(terms.version);
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  expect(await authApi.accepted()).toEqual([]);
  await authApi.accept(terms.version);
  expect(await authApi.accepted()).toContain(terms.version);
});

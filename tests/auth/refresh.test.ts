import { apiRequest, refreshSession } from "@/api/client";
import { useAuthState } from "@/integrations/auth/state";
import { session } from "../helpers";

const fetchMock = jest.fn();
const response = (data: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => data,
});
const renewable = {
  ...session,
  expiresAt: "2000-01-01",
  refreshToken: "secret",
  refreshExpiresAt: "2099-01-01",
};
beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
  useAuthState.getState().setSession(renewable);
});

test("renova uma vez para chamadas simultaneas e apaga o refresh", async () => {
  fetchMock
    .mockResolvedValueOnce(
      response({
        ...session,
        accessToken: "renewed",
        refreshToken: null,
        refreshExpiresAt: null,
      }),
    )
    .mockResolvedValue(response({ id: 1 }));
  await Promise.all([apiRequest("/me"), apiRequest("/classrooms")]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/auth\/refresh$/);
  expect(options.credentials).toBe("include");
  expect(options.headers.get("Authorization")).toBeNull();
  expect(JSON.parse(options.body)).toEqual({ refreshToken: "secret" });
  expect(useAuthState.getState().session).toMatchObject({
    accessToken: "renewed",
    refreshToken: null,
    refreshExpiresAt: null,
  });
  expect(fetchMock.mock.calls[1][1].headers.get("Authorization")).toBe(
    "Bearer renewed",
  );
});

test.each([
  { ...renewable, twoFactorRequired: true },
  { ...renewable, refreshExpiresAt: "2000-01-01" },
  { ...renewable, refreshToken: null },
])("nao renova sem credencial valida ou com 2FA pendente", async (value) => {
  useAuthState.getState().setSession(value);
  await expect(refreshSession()).rejects.toHaveProperty("status", 401);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(useAuthState.getState().session).toBeNull();
});

test("falha na renovacao encerra a sessao e nao repete o segredo", async () => {
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await expect(refreshSession()).rejects.toThrow("offline");
  await expect(refreshSession()).rejects.toHaveProperty("status", 401);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("acesso renovado expira sem uma segunda renovacao", async () => {
  fetchMock.mockResolvedValueOnce(
    response({ ...session, accessToken: "renewed" }),
  );
  await refreshSession();
  const renewed = useAuthState.getState().session!;
  useAuthState.getState().setSession({ ...renewed, expiresAt: "2000-01-01" });
  await expect(apiRequest("/me")).rejects.toHaveProperty("status", 401);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(useAuthState.getState().session).toBeNull();
});

test("renovacao antiga nao restaura sessao apos logout", async () => {
  let resolve!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = refreshSession();
  useAuthState.getState().setSession(null);
  resolve(response({ ...session, accessToken: "renewed" }));
  await expect(pending).rejects.toHaveProperty("name", "AbortError");
  expect(useAuthState.getState().session).toBeNull();
});

test("401 renova e repete a chamada apenas uma vez", async () => {
  useAuthState.getState().setSession({ ...renewable, expiresAt: "2099-01-01" });
  fetchMock
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(response({ ...session, accessToken: "renewed" }))
    .mockResolvedValueOnce(response({}, 401));
  await expect(apiRequest("/me")).rejects.toHaveProperty("status", 401);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(useAuthState.getState().session).toBeNull();
});

test("login publico inclui cookie e omite Authorization", async () => {
  fetchMock.mockResolvedValueOnce(response(session));
  await apiRequest("/auth/login", {
    method: "POST",
    body: { email: "a@b.com", password: "secret" },
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][1].credentials).toBe("include");
  expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBeNull();
});

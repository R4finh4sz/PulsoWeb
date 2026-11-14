import { ApiError } from "@/api/client";
import { authApi } from "@/integrations/auth/api";
import { profileApi } from "@/integrations/profile/api";
import { useAuthState } from "@/integrations/auth/state";
import { session } from "../helpers";

beforeEach(() => {
  useAuthState.getState().setSession(session);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 });
});
afterEach(() => useAuthState.getState().setSession(null));

test("foto usa PUT multipart autenticado e consulta como blob", async () => {
  const file = new File(["image"], "foto.png", { type: "image/png" });
  await expect(profileApi.updatePhoto(file)).resolves.toBeUndefined();
  const [url, options] = jest.mocked(fetch).mock.calls[0];
  expect(url).toMatch(/\/me\/photo$/);
  expect(options?.method).toBe("PUT");
  expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer token");
  expect(new Headers(options?.headers).get("Content-Type")).toBeNull();
  expect((options?.body as FormData).get("photo")).toBe(file);
  const blob = new Blob(["image"], { type: "image/png" });
  jest.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob } as Response);
  await expect(profileApi.photo()).resolves.toBe(blob);
  expect(new Headers(jest.mocked(fetch).mock.calls[1][1]?.headers).get("Accept")).toContain("image/png");
  jest.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
  await expect(profileApi.photo()).resolves.toBeUndefined();
  await expect(profileApi.updatePhoto(new File(["text"], "text.txt", { type: "text/plain" }))).rejects.toThrow("Selecione uma imagem JPEG ou PNG.");
  await expect(profileApi.updatePhoto(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "foto.png", { type: "image/png" }))).rejects.toThrow("A foto deve ter no máximo 2 MB.");
});

test.each([
  [
    () => authApi.requestPasswordReset("ana@example.com"),
    "request",
    { email: "ana@example.com" },
  ],
  [
    () => authApi.verifyPasswordReset("ana@example.com", "123456"),
    "verify",
    { email: "ana@example.com", code: "123456" },
  ],
  [
    () =>
      authApi.resetPassword(
        "ana@example.com",
        "reset-token",
        "Password1",
        "Password1",
      ),
    "reset",
    {
      email: "ana@example.com",
      resetToken: "reset-token",
      newPassword: "Password1",
      confirmPassword: "Password1",
    },
  ],
] as const)(
  "password recovery uses public contract %s",
  async (call, endpoint, body) => {
    await call();
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/password-recovery/" + endpoint,
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
    const headers = jest.mocked(fetch).mock.calls[0][1]!.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  },
);
test("public recovery failure preserves signed-in session", async () => {
  jest
    .mocked(fetch)
    .mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Invalid reset token" }),
    } as Response);
  await expect(
    authApi.resetPassword(
      "ana@example.com",
      "bad-token",
      "Password1",
      "Password1",
    ),
  ).rejects.toBeInstanceOf(ApiError);
  expect(useAuthState.getState().session).toEqual(session);
});
test("password change sends only backend fields to authenticated PATCH route", async () => {
  await profileApi.changePassword({
    currentPassword: "Oldpass1",
    newPassword: "Newpass1",
    confirmPassword: "Newpass1",
  });
  expect(fetch).toHaveBeenCalledWith(
    "/api/auth/password",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "Oldpass1",
        newPassword: "Newpass1",
      }),
    }),
  );
  const headers = jest.mocked(fetch).mock.calls[0][1]!.headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer " + session.accessToken);
});
test("deletion request uses plural endpoint", async () => {
  const body = { currentPassword: "Oldpass1", reason: "Leaving school" };
  await profileApi.requestDeletion(body);
  expect(fetch).toHaveBeenCalledWith(
    "/api/me/deletion-requests",
    expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
  );
});

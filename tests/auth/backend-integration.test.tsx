import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/api/client";
import { useAuthState } from "@/integrations/auth/state";
import { useActiveSchool } from "@/integrations/auth/hooks";
import { quizzesApi } from "@/integrations/quizzes/api";
import { registrationApi } from "@/integrations/registration/api";
import { notificationsApi } from "@/integrations/notifications/api";
import { accountDeletionsApi } from "@/integrations/profile/deletions";

const user = { id: 3, fullName: "Professor", email: "teacher@test.com", ra: "3", role: "TEACHER" as const, classroomId: null, schoolIds: [1, 2], activeSchoolId: 1, schoolId: 1 };
beforeEach(() => {
  global.fetch = jest.fn();
  useAuthState.getState().setSession({ accessToken: "real-token", tokenType: "Bearer", expiresAt: "2099-01-01", twoFactorRequired: false, codeExpiresAt: "", resendAvailableAt: "", user: { ...user, firstLogin: false, termsAccepted: true, termsAcceptedVersions: [] } });
});
afterEach(() => useAuthState.getState().setSession(null));
const respond = (value: unknown, status = 200) => jest.mocked(fetch).mockResolvedValueOnce({ ok: status < 400, status, json: async () => value } as Response);

test.each([[], { content: [], totalPages: 0 }])("normaliza a fila vazia de exclusões: %j", async (response) => {
  respond(response);
  expect(await accountDeletionsApi.list("PENDING")).toEqual([]);
});

test("carrega todas as páginas de pedidos de exclusão e preserva o sinal", async () => {
  const request = { id: 1, name: "Professor", email: "teacher@test.com", role: "TEACHER", reason: "", createdAt: "2026-01-01", status: "PENDING" };
  respond({ content: [request], totalPages: 2 });
  respond({ content: [{ ...request, id: 2 }], totalPages: 2 });
  const signal = new AbortController().signal;
  expect(await accountDeletionsApi.list("PENDING", signal)).toEqual([request, { ...request, id: 2 }]);
  expect(fetch).toHaveBeenLastCalledWith("/api/account-deletion-requests?status=PENDING&page=1", expect.objectContaining({ signal }));
});

test("resposta inválida da fila de exclusões vira erro da consulta", async () => {
  respond({ unexpected: true });
  await expect(accountDeletionsApi.list("PENDING")).rejects.toThrow("Formato inválido");
});

test("troca escola pelo backend, sincroniza sessão e descarta dados da escola anterior", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["session"], user);
  for (const key of ["classrooms", "subjects", "quizzes", "teacher-activities"]) client.setQueryData([key], ["previous-school"]);
  respond(undefined, 204);
  respond({ ...user, activeSchoolId: 2, schoolId: 2 });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useActiveSchool(), { wrapper });
  await act(async () => { await result.current.mutateAsync(2); });
  expect(fetch).toHaveBeenNthCalledWith(1, "/api/me/active-school", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ schoolId: 2 }) }));
  await waitFor(() => expect(useAuthState.getState().session?.user.schoolId).toBe(2));
  expect(client.getQueryData(["session"])).toMatchObject({ schoolId: 2 });
  for (const key of ["classrooms", "subjects", "quizzes", "teacher-activities"]) expect(client.getQueryData([key])).toBeUndefined();
  client.clear();
});

test("envia dez respostas com null e usa a correção do servidor", async () => {
  const answers = [0, 1, null, 2, 3, 0, 1, 2, 3, 0];
  const submission = { quizId: 7, studentId: 4, submittedAt: "2026-10-22T12:00:00Z", score: { correct: 6, total: 10, grade: 6, themes: [], review: [] } };
  respond(submission);
  expect(await quizzesApi.submit(7, answers)).toEqual(submission);
  expect(fetch).toHaveBeenCalledWith("/api/quizzes/7/submit", expect.objectContaining({ method: "POST", body: JSON.stringify({ answers }) }));
  respond({ detail: "Prazo encerrado" }, 409);
  await expect(quizzesApi.submit(7, answers)).rejects.toBeInstanceOf(ApiError);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test.each(["INTERNAL", "EMAIL"] as const)("preserva delivery %s sem solicitar envio adicional", async (delivery) => {
  respond({ delivery });
  expect(await registrationApi.invite("teachers", { email: "teacher@test.com" })).toEqual({ delivery });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith("/api/invitations/teachers", expect.objectContaining({ body: JSON.stringify({ email: "teacher@test.com" }) }));
});

test("marca a URL fornecida pela notificação sem duplicar /api", async () => {
  respond(undefined, 204);
  await notificationsApi.read("/api/school-invitations/9/read");
  expect(fetch).toHaveBeenCalledWith("/api/school-invitations/9/read", expect.objectContaining({ method: "PATCH" }));
  expect(() => notificationsApi.read("https://example.com/read")).toThrow();
});

test("conclusão do convite envia a matrícula preenchida com o nome esperado pelo backend", async () => {
  respond({ id: 1, status: "PENDING" });
  await registrationApi.complete("invite-token", {
    name: "Professor",
    ra: " 1000 ",
    password: "Password1",
    termsAccepted: true,
    termsVersion: "1",
  });
  expect(fetch).toHaveBeenCalledWith("/api/invitations/invite-token/complete", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ name: "Professor", matricula: "1000", password: "Password1", termsAccepted: true, termsVersion: "1" }),
  }));
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TermsActions } from "@/components/screens/Terms/TermsActions";
import { queryWrapper, router, session } from "../helpers";

import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";
jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/auth/api", () => ({
  authApi: { revokeTerms: jest.fn(), logout: jest.fn() },
}));
const teacherSession = {
  ...session,
  user: { ...session.user, role: "TEACHER" as const },
};
beforeEach(() => {
  jest.mocked(authApi.revokeTerms).mockReset().mockResolvedValue(undefined);
  useAuthState.getState().setSession(teacherSession);
});
afterEach(() => useAuthState.getState().setSession(null));

test("admin não recebe botão nem diálogo de revogação", () => {
  useAuthState.getState().setSession(session);
  render(<TermsActions />, { wrapper: queryWrapper().wrapper });
  expect(
    screen.queryByRole("button", { name: "Revogar" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Voltar" })).toBeVisible();
  expect(document.querySelector("dialog")).toBeNull();
});

test("avisa sobre perda de acesso e permite cancelar sem revogar", () => {
  render(<TermsActions />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(screen.getByRole("button", { name: "Revogar" }));
  expect(screen.getByRole("dialog", { name: "AVISO!" })).toHaveTextContent(
    "será necessário aceitar os termos novamente",
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(authApi.revokeTerms).not.toHaveBeenCalled();
  expect(authApi.logout).not.toHaveBeenCalled();
});

test("somente após confirmar e revogar no servidor encerra a sessão", async () => {
  const { client, wrapper } = queryWrapper();
  client.setQueryDefaults(["private-cache"], { gcTime: Infinity });
  client.setQueryData(["private-cache"], { privateData: true });
  render(<TermsActions />, { wrapper });
  fireEvent.click(screen.getByRole("button", { name: "Revogar" }));
  fireEvent.click(screen.getByRole("button", { name: "Sim, Revogar" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(authApi.revokeTerms).toHaveBeenCalledTimes(1);
  expect(authApi.logout).not.toHaveBeenCalled();
  expect(useAuthState.getState().session).toBeNull();
  expect(client.getQueryData(["private-cache"])).toBeUndefined();
});

test("falha de revogação mantém o diálogo e a sessão para tentar novamente", async () => {
  jest
    .mocked(authApi.revokeTerms)
    .mockRejectedValueOnce(new Error("Falha ao revogar."));
  render(<TermsActions />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(screen.getByRole("button", { name: "Revogar" }));
  fireEvent.click(screen.getByRole("button", { name: "Sim, Revogar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Falha ao revogar.",
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(useAuthState.getState().session).toEqual(teacherSession);
  expect(authApi.logout).not.toHaveBeenCalled();
});

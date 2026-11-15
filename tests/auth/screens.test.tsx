import ForgotPassword from "@/app/forgot-password/page";
import Login from "@/app/page";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { AuthGate } from "@/components/screens/Login/AuthGate";
import { TwoFactorScreen } from "@/components/screens/Login/TwoFactorScreen";
import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";
import { queryWrapper as baseQueryWrapper, router, session } from "../helpers";
import { FeedbackModalHost } from "@/components/ui/FeedbackModalHost";
import { useFeedbackStore } from "@/store/feedbackStore";

function queryWrapper() {
  const base = baseQueryWrapper();
  return {
    ...base,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <base.wrapper>
        {children}
        <FeedbackModalHost />
      </base.wrapper>
    ),
  };
}
let pathname = "/admin";
jest.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname,
}));
jest.mock("@/integrations/auth/api", () => ({
  authApi: {
    me: jest.fn(),
    login: jest.fn(),
    verify: jest.fn(),
    resend: jest.fn(),
    terms: jest.fn(),
    accepted: jest.fn(),
    accept: jest.fn(),
    requestPasswordReset: jest.fn(),
    verifyPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  },
}));
beforeEach(() => {
  useFeedbackStore.setState({ feedback: null });
  pathname = "/admin";
  useAuthState.getState().setSession(null);
  jest
    .mocked(authApi.me)
    .mockResolvedValue({
      id: 1,
      fullName: "Ana",
      email: "a@b.com",
      role: "ADMIN",
    } as Awaited<ReturnType<typeof authApi.me>>);
  jest
    .mocked(authApi.terms)
    .mockResolvedValue({ title: "Termos", version: "1", content: "Conteúdo" });
  jest.mocked(authApi.accepted).mockResolvedValue(["1"]);
  jest.mocked(authApi.accept).mockResolvedValue();
});
test("tela de login valida e mostra erros do servidor", async () => {
  jest.mocked(authApi.login).mockRejectedValue(new Error("Senha incorreta"));
  const { container } = render(<Login />, { wrapper: queryWrapper().wrapper });
  expect(
    screen.getByRole("link", { name: "Esqueci minha senha" }),
  ).toHaveAttribute("href", "/forgot-password");
  fireEvent.submit(container.querySelector("form")!);
  expect(screen.getAllByRole("alert")).toHaveLength(2);
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "a@b.com" },
  });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "x" } });
  fireEvent.submit(container.querySelector("form")!);
  expect(await screen.findByText("Senha incorreta")).toBeVisible();
});
async function recovery() {
  const view = render(<ForgotPassword />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "a@b.com" },
  });
  fireEvent.submit(view.container.querySelector("form")!);
  fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
  const digits = screen.getAllByRole("textbox");
  fireEvent.change(digits[0], { target: { value: "1" } });
  fireEvent.keyDown(digits[1], { key: "Backspace" });
  expect(digits[0]).toHaveValue("");
  fireEvent.keyDown(digits[0], { key: "ArrowRight" });
  expect(digits[1]).toHaveFocus();
  fireEvent.keyDown(digits[1], { key: "ArrowLeft" });
  fireEvent.paste(digits[0], { clipboardData: { getData: () => "123456" } });
  return view;
}
test("recuperação bloqueia reenvio por três minutos a cada solicitação", async () => {
  jest.mocked(authApi.requestPasswordReset).mockResolvedValue();
  jest.useFakeTimers();
  try {
    await recovery();
    expect(screen.getByRole("button", { name: /Reenviar em 03:00/ })).toBeDisabled();
    act(() => jest.advanceTimersByTime(179_000));
    expect(screen.getByRole("button", { name: "Reenviar em 00:01" })).toBeDisabled();
    act(() => jest.advanceTimersByTime(1_000));
    const resend = screen.getByRole("button", { name: "Reenviar" });
    expect(resend).toBeEnabled();
    await act(async () => {
      fireEvent.click(resend);
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(authApi.requestPasswordReset).toHaveBeenCalledTimes(2);
    expect(jest.mocked(authApi.requestPasswordReset).mock.calls[1][0]).toBe("a@b.com");
    expect(screen.getByRole("button", { name: "Reenviar em 03:00" })).toBeDisabled();
    expect(screen.getByLabelText("Dígito 1 de 6")).toHaveValue("");
    act(() => jest.advanceTimersByTime(180_000));
    jest.mocked(authApi.requestPasswordReset).mockRejectedValueOnce(new Error("Falha no envio"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reenviar" }));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("dialog", { name: "Erro" })).toHaveTextContent("Falha no envio");
    expect(screen.getByRole("button", { name: "Reenviar em 03:00" })).toBeDisabled();
  } finally {
    jest.useRealTimers();
  }
});

test("recuperação verifica código, compara confirmação e redefine senha", async () => {
  jest.mocked(authApi.requestPasswordReset).mockResolvedValue();
  jest
    .mocked(authApi.verifyPasswordReset)
    .mockResolvedValue({ resetToken: "reset-token" });
  jest.mocked(authApi.resetPassword).mockResolvedValue();
  const { container } = await recovery();
  fireEvent.submit(container.querySelector("form")!);
  await screen.findByLabelText("Nova senha");
  expect(screen.getByText("Pelo menos 8 caracteres")).toHaveTextContent("Pendente:");
  fireEvent.change(screen.getByLabelText("Nova senha"), {
    target: { value: "Password1" },
  });
  for (const label of ["Pelo menos 8 caracteres", "Uma letra maiúscula de A a Z", "Um número", "No máximo 72 bytes UTF-8"])
    expect(screen.getByText(label)).toHaveClass("text-green-700");
  expect(screen.getByText("As senhas são iguais")).toHaveTextContent("Pendente:");
  fireEvent.change(screen.getByLabelText("Repita a nova senha"), {
    target: { value: "Other123" },
  });
  fireEvent.submit(container.querySelector("form")!);
  expect(screen.getByRole("dialog")).toHaveTextContent("iguais");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  fireEvent.change(screen.getByLabelText("Repita a nova senha"), {
    target: { value: "Password1" },
  });
  expect(screen.getByText("As senhas são iguais")).toHaveClass("text-green-700");
  fireEvent.change(screen.getByLabelText("Repita a nova senha"), {
    target: { value: "Password2" },
  });
  expect(screen.getByText("As senhas são iguais")).toHaveTextContent("Pendente:");
  fireEvent.change(screen.getByLabelText("Repita a nova senha"), {
    target: { value: "Password1" },
  });
  fireEvent.submit(container.querySelector("form")!);
  expect(await screen.findByRole("dialog")).toHaveTextContent(
    "Senha alterada com sucesso",
  );
  expect(authApi.resetPassword).toHaveBeenCalledWith(
    "a@b.com",
    "reset-token",
    "Password1",
    "Password1",
  );
});
test.each([new Error("Código inválido"), new Error("Código expirado ou limite de tentativas atingido. Solicite reenvio."), "failure"])(
  "recuperação mostra falha no código e senha: %s",
  async (failure) => {
    jest.mocked(authApi.requestPasswordReset).mockResolvedValue();
    jest
      .mocked(authApi.verifyPasswordReset)
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ resetToken: "reset-token" });
    jest.mocked(authApi.resetPassword).mockRejectedValue(failure);
    const { container } = await recovery();
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByRole("dialog", { name: "Erro" })).toHaveTextContent(
      failure instanceof Error ? failure.message : failure,
    );
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    fireEvent.change(screen.getByLabelText("Dígito 1 de 6"), {
      target: { value: "654321" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByLabelText("Nova senha");
    for (const label of ["Nova senha", "Repita a nova senha"])
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "Password1" },
      });
    fireEvent.submit(container.querySelector("form")!);
    expect(
      await screen.findByRole("dialog", { name: "Erro" }),
    ).toHaveTextContent(failure instanceof Error ? failure.message : failure);
  },
);
test("2FA distribui autofill, navega entre dígitos e verifica", async () => {
  jest.mocked(authApi.verify).mockResolvedValue();
  const { container } = render(
    <TwoFactorScreen session={{ ...session, twoFactorRequired: true }} />,
    { wrapper: queryWrapper().wrapper },
  );
  const digits = screen.getAllByRole("textbox");
  fireEvent.change(digits[0], { target: { value: "1" } });
  fireEvent.keyDown(digits[1], { key: "Backspace" });
  expect(digits[0]).toHaveValue("");
  fireEvent.keyDown(digits[0], { key: "ArrowRight" });
  expect(digits[1]).toHaveFocus();
  fireEvent.keyDown(digits[1], { key: "ArrowLeft" });
  fireEvent.keyDown(digits[0], { key: "a" });
  fireEvent.submit(container.querySelector("form")!);
  expect(authApi.verify).not.toHaveBeenCalled();
  fireEvent.paste(digits[4], { clipboardData: { getData: () => "123456" } });
  expect(
    digits.map((input) => (input as HTMLInputElement).value).join(""),
  ).toBe("123456");
  fireEvent.submit(container.querySelector("form")!);
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(useAuthState.getState().session?.twoFactorRequired).toBe(false),
  );
  expect(authApi.verify).toHaveBeenCalledTimes(1);
});
test("2FA mostra erro e reenvia código limpando campos", async () => {
  jest.mocked(authApi.verify).mockRejectedValue(new Error("Código inválido"));
  jest
    .mocked(authApi.resend)
    .mockResolvedValue({
      twoFactorRequired: true,
      codeExpiresAt: session.codeExpiresAt,
      resendAvailableAt: session.resendAvailableAt,
    });
  const { container } = render(<TwoFactorScreen session={session} />, {
    wrapper: queryWrapper().wrapper,
  });
  fireEvent.change(screen.getAllByRole("textbox")[0], {
    target: { value: "123456" },
  });
  fireEvent.submit(container.querySelector("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("Código inválido");
  fireEvent.click(screen.getByRole("button", { name: "Reenviar" }));
  await waitFor(() =>
    expect(screen.getAllByRole("textbox")[0]).toHaveValue(""),
  );
});
test("2FA bloqueia código expirado e respeita espera do reenvio", () => {
  render(
    <TwoFactorScreen
      session={{
        ...session,
        codeExpiresAt: "2000-01-01",
        resendAvailableAt: "2099-01-01",
      }}
    />,
    { wrapper: queryWrapper().wrapper },
  );
  expect(screen.getByRole("status")).toHaveTextContent("expirado");
  expect(screen.getByRole("button", { name: /Reenviar em/ })).toBeDisabled();
});
test.each(["/", "/registration", "/invite/abc", "/forgot-password"])(
  "gate libera rota pública %s",
  (path) => {
    pathname = path;
    render(
      <AuthGate>
        <p>Conteúdo protegido</p>
      </AuthGate>,
      { wrapper: queryWrapper().wrapper },
    );
    expect(screen.getByText("Conteúdo protegido")).toBeVisible();
    expect(router.replace).not.toHaveBeenCalled();
  },
);
test("gate redireciona visitante e expira credenciais", () => {
  const { rerender } = render(
    <AuthGate>
      <p>Privado</p>
    </AuthGate>,
    { wrapper: queryWrapper().wrapper },
  );
  expect(router.replace).toHaveBeenCalledWith("/");
  expect(screen.queryByText("Privado")).toBeNull();
  act(() =>
    useAuthState.getState().setSession({ ...session, expiresAt: "2000-01-01" }),
  );
  rerender(
    <AuthGate>
      <p>Privado</p>
    </AuthGate>,
  );
  expect(useAuthState.getState().session).toBeNull();
});
test("gate exige 2FA quando indicado", () => {
  useAuthState.getState().setSession({ ...session, twoFactorRequired: true });
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(screen.getByText("Confirme seu acesso")).toBeVisible();
});
test.each([true, false])("gate permite acesso após termos: %s", (absent) => {
  if (absent) jest.mocked(authApi.terms).mockResolvedValue(null);
  useAuthState.getState().setSession(session);
  render(
    <AuthGate>
      <p>Privado</p>
    </AuthGate>,
    { wrapper: queryWrapper().wrapper },
  );
  return expect(screen.findByText("Privado")).resolves.toBeVisible();
});
test.each(["login", "me", "login-boolean", "me-boolean", "login-user-boolean"])("gate avisa escola indisponível recebida em %s", async (source) => {
  pathname = "/teacher/schools/1";
  useAuthState.getState().setSession({
    ...session,
    schoolAccessStatus: source === "login" ? "SCHOOL_UNAVAILABLE" : undefined,
    schoolUnavailable: source === "login-boolean" ? true : undefined,
    user: { ...session.user, role: "TEACHER", schoolId: null, classroomId: null, schoolUnavailable: source === "login-user-boolean" ? true : undefined },
  });
  jest.mocked(authApi.me).mockResolvedValue({
    id: 1, fullName: "Ana", email: "a@b.com", ra: "123", role: "TEACHER",
    classroomId: null,
    schoolAccessStatus: source === "me" ? "SCHOOL_UNAVAILABLE" : undefined,
    schoolUnavailable: source === "me-boolean" ? true : undefined,
  });
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Escola indisponível")).toBeVisible();
  expect(screen.queryByText("Privado")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(router.replace).toHaveBeenCalledWith("/teacher");
  expect(useAuthState.getState().session).not.toBeNull();
});

test("me com escola disponível libera sessão com aviso antigo no login", async () => {
  useAuthState.getState().setSession({ ...session, schoolUnavailable: true });
  jest.mocked(authApi.me).mockResolvedValue({ id: 1, fullName: "Ana", email: "a@b.com", ra: "1", role: "ADMIN", classroomId: null, schoolUnavailable: false });
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Privado")).toBeVisible();
  expect(screen.queryByText("Escola indisponível")).not.toBeInTheDocument();
});

test("coordenador sem escola ativa fica pendente sem abrir operações da escola", async () => {
  pathname = "/coordinator";
  useAuthState.getState().setSession({ ...session, user: { ...session.user, role: "PEDAGOGICAL_COORDINATOR" } });
  jest.mocked(authApi.me).mockResolvedValue({ id: 1, fullName: "Ana", email: "a@b.com", ra: "1", role: "PEDAGOGICAL_COORDINATOR", classroomId: null, schoolUnavailable: true });
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
  expect(screen.getByRole("heading", { name: "Pendente de vínculo" })).toBeVisible();
  expect(screen.queryByText("Privado")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Acessar meu perfil" })).toHaveAttribute("href", "/coordinator/profile");
});

test("professor pode abrir outra escola após confirmar o aviso", async () => {
  pathname = "/teacher";
  useAuthState.getState().setSession({ ...session, schoolUnavailable: true, user: { ...session.user, role: "TEACHER" } });
  jest.mocked(authApi.me).mockResolvedValue({ id: 1, fullName: "Ana", email: "a@b.com", ra: "1", role: "TEACHER", classroomId: null, schoolUnavailable: true });
  const view = render(<AuthGate>Escolha de escola</AuthGate>, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
  expect(screen.getByText("Escolha de escola")).toBeVisible();
  router.replace.mockClear();
  pathname = "/teacher/schools/2";
  view.rerender(<AuthGate>Outra escola</AuthGate>);
  expect(screen.getByText("Outra escola")).toBeVisible();
  expect(router.replace).not.toHaveBeenCalled();
});

test("gate pede leitura, checkbox e aceite da versão atual", async () => {
  jest
    .mocked(authApi.accepted)
    .mockResolvedValueOnce([])
    .mockResolvedValue(["1"]);
  useAuthState.getState().setSession(session);
  render(
    <AuthGate>
      <p>Privado</p>
    </AuthGate>,
    { wrapper: queryWrapper().wrapper },
  );
  await screen.findByRole("checkbox");
  expect(screen.getByText("Conteúdo")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Aceitar e continuar" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
  await screen.findByText("Privado");
  expect(authApi.accept).toHaveBeenCalledWith("1");
});

test("login do professor com termsAccepted false exige novo aceite mesmo com versão no histórico", async () => {
  pathname = "/teacher";
  jest
    .mocked(authApi.me)
    .mockResolvedValue({
      id: 3,
      fullName: "Professor",
      role: "TEACHER",
    } as Awaited<ReturnType<typeof authApi.me>>);
  useAuthState
    .getState()
    .setSession({
      ...session,
      user: { ...session.user, role: "TEACHER", termsAccepted: false },
    });
  render(
    <AuthGate>
      <p>Área do professor</p>
    </AuthGate>,
    { wrapper: queryWrapper().wrapper },
  );
  await screen.findByRole("checkbox");
  expect(screen.queryByText("Área do professor")).not.toBeInTheDocument();
  expect(authApi.me).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
  expect(await screen.findByText("Área do professor")).toBeVisible();
  expect(useAuthState.getState().session?.user.termsAccepted).toBe(true);
});

test("aceite recusado pelo backend mantém termsAccepted false e bloqueia o professor", async () => {
  jest
    .mocked(authApi.accept)
    .mockRejectedValueOnce(new Error("Não foi possível registrar o aceite."));
  useAuthState
    .getState()
    .setSession({
      ...session,
      user: { ...session.user, role: "TEACHER", termsAccepted: false },
    });
  render(
    <AuthGate>
      <p>Área do professor</p>
    </AuthGate>,
    { wrapper: queryWrapper().wrapper },
  );
  await screen.findByRole("checkbox");
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível registrar",
  );
  expect(useAuthState.getState().session?.user.termsAccepted).toBe(false);
  expect(screen.queryByText("Área do professor")).not.toBeInTheDocument();
});

test("termos ausentes não liberam login quando o backend exige aceite", async () => {
  jest.mocked(authApi.terms).mockResolvedValue(null);
  useAuthState
    .getState()
    .setSession({
      ...session,
      user: { ...session.user, termsAccepted: false },
    });
  render(
    <AuthGate>
      <p>Privado</p>
    </AuthGate>,
    { wrapper: queryWrapper().wrapper },
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "não estão disponíveis",
  );
  expect(screen.queryByText("Privado")).not.toBeInTheDocument();
  expect(authApi.me).not.toHaveBeenCalled();
});
test("erro de aceite limpa checkbox e atualiza termos", async () => {
  jest.mocked(authApi.accepted).mockResolvedValue([]);
  jest.mocked(authApi.accept).mockRejectedValue(new Error("Versão mudou"));
  useAuthState.getState().setSession(session);
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  await screen.findByRole("checkbox");
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Versão mudou");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
});
test("gate permite tentar novamente após erro de termos", async () => {
  jest
    .mocked(authApi.terms)
    .mockRejectedValueOnce(new Error("Termos offline"))
    .mockResolvedValue(null);
  useAuthState.getState().setSession(session);
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent("Termos offline");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Privado");
});
test("gate trata erro de perfil e redireciona para papel correto", async () => {
  jest
    .mocked(authApi.me)
    .mockRejectedValueOnce(new Error("Perfil offline"))
    .mockResolvedValue({ id: 1, fullName: "Ana", role: "ADMIN" } as Awaited<
      ReturnType<typeof authApi.me>
    >);
  pathname = "/professor";
  useAuthState.getState().setSession(session);
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent("Perfil offline");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/admin"));
});

test("gate encerra sessão ociosa sem consumir refresh", async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn();
  useAuthState.getState().setSession({ ...session,
    expiresAt: new Date(Date.now() + 2 * 60_000).toISOString(),
    refreshToken: "unused", refreshExpiresAt: "2099-01-01",
  });
  render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  await act(async () => { await jest.advanceTimersByTimeAsync(2 * 60_000); });
  expect(useAuthState.getState().session).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});

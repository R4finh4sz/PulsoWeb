import { act, fireEvent, render, screen } from "@testing-library/react";
import { apiRequest } from "@/api/client";
import { FeedbackModalHost } from "@/components/ui/FeedbackModalHost";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useAuthState } from "@/integrations/auth/state";
import { session } from "../helpers";

const fetchMock = jest.fn();
beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
  useAuthState.getState().setSession(session);
  useFeedbackStore.setState({ feedback: null });
});
afterEach(() => {
  useAuthState.getState().setSession(null);
  useFeedbackStore.setState({ feedback: null });
});

test.each(["GET", "POST", "PUT", "PATCH", "DELETE"])(
  "erro HTTP de %s abre um modal com os detalhes da API",
  async (method) => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: "Dados inválidos",
        errors: ["E-mail já cadastrado", "Perfil inválido"],
      }),
    });
    render(<FeedbackModalHost />);
    await act(async () => {
      await expect(apiRequest("/faqs", { method })).rejects.toThrow(
        "Dados inválidos",
      );
    });
    const dialog = screen.getByRole("dialog", { name: "Erro" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveTextContent("E-mail já cadastrado");
    expect(dialog).toHaveTextContent("Perfil inválido");
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  },
);

test("falhas simultâneas são reunidas no mesmo modal", async () => {
  fetchMock.mockImplementation(async (url: string) => ({
    ok: false,
    status: 500,
    json: async () => ({
      detail: url.endsWith("/schools") ? "Falha nas escolas" : "Falha no FAQ",
    }),
  }));
  render(<FeedbackModalHost />);
  await act(async () => {
    await Promise.allSettled([apiRequest("/schools"), apiRequest("/faqs")]);
  });
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByRole("dialog")).toHaveTextContent("Falha nas escolas");
  expect(screen.getByRole("dialog")).toHaveTextContent("Falha no FAQ");
});

test("erro de conexão abre modal, cancelamento não abre", async () => {
  fetchMock.mockRejectedValueOnce(new DOMException("Cancelado", "AbortError"));
  render(<FeedbackModalHost />);
  await act(async () => {
    await expect(apiRequest("/faqs")).rejects.toThrow("Cancelado");
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  await act(async () => {
    await expect(apiRequest("/faqs")).rejects.toThrow();
  });
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "Não foi possível conectar ao servidor",
  );
});

test("renovação bem-sucedida de sessão não mostra o 401 intermediário", async () => {
  useAuthState
    .getState()
    .setSession({
      ...session,
      refreshToken: "refresh",
      refreshExpiresAt: "2099-01-01",
    });
  const ok = (data: unknown) => ({
    ok: true,
    status: 200,
    json: async () => data,
  });
  fetchMock
    .mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Expirou" }),
    })
    .mockResolvedValueOnce(ok({ ...session, accessToken: "renewed" }))
    .mockResolvedValueOnce(ok([]));
  render(<FeedbackModalHost />);
  await act(async () => {
    await expect(apiRequest("/faqs")).resolves.toEqual([]);
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

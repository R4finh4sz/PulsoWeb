import { FaqEditor, FaqForm } from "@/components/screens/Faq/FaqForm";
import { faqsApi } from "@/integrations/faqs/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { admin, queryWrapper, router } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/faqs/api", () => ({
  faqsApi: { create: jest.fn(), update: jest.fn(), list: jest.fn() },
}));

beforeEach(() => {
  jest.mocked(faqsApi.create).mockReset();
  router.push.mockClear();
});

test("admin cria pergunta com perfil e retorna para a lista", async () => {
  jest
    .mocked(faqsApi.create)
    .mockResolvedValue({
      title: "Pergunta",
      message: "Resposta",
      targetRole: "PEDAGOGICAL_COORDINATOR",
    });
  render(<FaqForm />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getByLabelText("Pergunta"), {
    target: { value: " Pergunta " },
  });
  fireEvent.change(screen.getByLabelText("Resposta"), {
    target: { value: " Resposta " },
  });
  fireEvent.change(screen.getByLabelText("Perfil"), {
    target: { value: "PEDAGOGICAL_COORDINATOR" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() =>
    expect(faqsApi.create).toHaveBeenCalledWith({
      title: "Pergunta",
      message: "Resposta",
      targetRole: "PEDAGOGICAL_COORDINATOR",
    }),
  );
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/admin/faq"));
});

test("edição preenche os campos e atualiza a pergunta existente", async () => {
  const faq = {
    id: 7,
    title: "Pergunta original",
    message: "Resposta original",
    targetRole: "STUDENT",
  };
  jest.mocked(faqsApi.update).mockResolvedValue(faq);
  render(<FaqForm faq={faq} />, { wrapper: queryWrapper().wrapper });
  expect(screen.getByLabelText("Pergunta")).toHaveValue("Pergunta original");
  expect(screen.getByLabelText("Perfil")).toHaveValue("STUDENT");
  fireEvent.change(screen.getByLabelText("Resposta"), {
    target: { value: "Resposta editada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() =>
    expect(faqsApi.update).toHaveBeenCalledWith(7, {
      title: "Pergunta original",
      message: "Resposta editada",
      targetRole: "STUDENT",
    }),
  );
  expect(faqsApi.create).not.toHaveBeenCalled();
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/admin/faq"));
});

test("editor carrega a pergunta pelo id e informa pergunta inexistente", async () => {
  jest
    .mocked(faqsApi.list)
    .mockResolvedValue([
      { id: 7, title: "Pergunta", message: "Resposta", targetRole: "TEACHER" },
    ]);
  const { rerender } = render(<FaqEditor id="7" user={admin} />, {
    wrapper: queryWrapper().wrapper,
  });
  expect(await screen.findByLabelText("Pergunta")).toHaveValue("Pergunta");
  rerender(<FaqEditor id="99" user={admin} />);
  expect(await screen.findByText("Pergunta não encontrada.")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Salvar" }),
  ).not.toBeInTheDocument();
});

test("rejeita pergunta composta de espacos", async () => {
  render(<FaqForm />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getByLabelText("Pergunta"), {
    target: { value: "   " },
  });
  fireEvent.change(screen.getByLabelText("Resposta"), {
    target: { value: "Resposta" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(faqsApi.create).not.toHaveBeenCalled();
});

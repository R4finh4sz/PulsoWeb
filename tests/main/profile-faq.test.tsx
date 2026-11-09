import { FaqContent } from "@/components/screens/Faq";
import { faqsApi } from "@/integrations/faqs/api";
import { fireEvent, render, screen } from "@testing-library/react";
import { admin, coordinator, queryWrapper, router, teacher } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => router }));

jest.mock("@/integrations/faqs/api", () => ({ faqsApi: { list: jest.fn() } }));

beforeEach(() => jest.mocked(faqsApi.list).mockReset());

test("admin filtra por perfil e tem edição ao lado de cada pergunta", async () => {
  jest.mocked(faqsApi.list).mockResolvedValue([
    {
      id: 1,
      title: "Pergunta docente",
      message: "Resposta",
      targetRole: "TEACHER",
    },
    {
      id: 2,
      title: "Pergunta aluno",
      message: "Resposta",
      targetRole: "STUDENT",
    },
    {
      id: 3,
      title: "Pergunta coordenação",
      message: "Resposta",
      targetRole: "PEDAGOGICAL_COORDINATOR",
    },
  ]);
  render(<FaqContent user={admin} />, { wrapper: queryWrapper().wrapper });
  expect(
    await screen.findByRole("link", {
      name: "Editar pergunta: Pergunta docente",
    }),
  ).toHaveAttribute("href", "/admin/faq/1/edit");
  fireEvent.change(screen.getByLabelText("Perfil do FAQ"), {
    target: { value: "PEDAGOGICAL_COORDINATOR" },
  });
  expect(screen.getByText("Pergunta coordenação")).toBeVisible();
  expect(screen.queryByText("Pergunta docente")).not.toBeInTheDocument();
  expect(screen.queryByText("Pergunta aluno")).not.toBeInTheDocument();
});

test.each([teacher, coordinator])(
  "FAQ carrega ao abrir para $role e exibe pergunta e resposta",
  async (user) => {
    jest
      .mocked(faqsApi.list)
      .mockResolvedValue([
        {
          title: "Como acessar minhas turmas?",
          targetRole: "TEACHER",
          message: "Acesse a opção Minhas Turmas no menu.",
        },
      ]);
    render(<FaqContent user={user} />, { wrapper: queryWrapper().wrapper });
    expect(
      await screen.findByText("Como acessar minhas turmas?"),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Editar pergunta/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Como acessar minhas turmas?"));
    expect(
      screen.getByText("Acesse a opção Minhas Turmas no menu."),
    ).toBeVisible();
  },
);

test("FAQ informa lista vazia", async () => {
  jest.mocked(faqsApi.list).mockResolvedValue([]);
  render(<FaqContent user={teacher} />, { wrapper: queryWrapper().wrapper });
  expect(
    await screen.findByText("Nenhuma pergunta disponível para seu perfil."),
  ).toBeVisible();
});

test("FAQ permite tentar novamente após erro", async () => {
  jest
    .mocked(faqsApi.list)
    .mockRejectedValueOnce(new Error("Falha ao carregar FAQ."))
    .mockResolvedValue([]);
  render(<FaqContent user={teacher} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Falha ao carregar FAQ.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByText("Nenhuma pergunta disponível para seu perfil."),
  ).toBeVisible();
});

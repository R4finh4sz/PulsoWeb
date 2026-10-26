import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SubjectThemes } from "@/components/screens/ClassroomDetails/SubjectThemes";
import { ThemeNameSchema } from "@/validation/Theme.validation";
import { quizzesApi } from "@/integrations/quizzes/api";
import { queryWrapper } from "../helpers";

jest.mock("@/integrations/quizzes/api", () => ({ quizzesApi: { themes: jest.fn(), createTheme: jest.fn(), removeTheme: jest.fn() } }));
jest.mock("@/components/screens/Integration/shared", () => ({ actionClass: "button", fieldClass: "input", ErrorMessage: ({ error }: { error: Error | null }) => error ? <p role="alert">{error.message}</p> : null }));
const subject = { id: 4, classroomId: 2, name: "Matemática", teacherId: 3 };
beforeEach(() => {
  jest.mocked(quizzesApi.removeTheme).mockImplementation(async () => { jest.mocked(quizzesApi.themes).mockResolvedValue([]); });
  jest.mocked(quizzesApi.themes).mockResolvedValue(["Frações"]);
  jest.mocked(quizzesApi.createTheme).mockImplementation(async (_classroom, _subject, name) => {
    jest.mocked(quizzesApi.themes).mockResolvedValue(["Frações", name]);
    return { name };
  });
});

test.each(["", "   ", "123", "!!!", "a".repeat(41)])("rejeita tema inválido: %j", (name) => {
  expect(ThemeNameSchema.safeParse(name).success).toBe(false);
});
test.each(["á", "a".repeat(40), "  Frações 2  "])("aceita tema válido: %j", (name) => {
  expect(ThemeNameSchema.parse(name)).toBe(name.trim());
});

test("modal lista temas e cadastra nome validado, atualizando a lista", async () => {
  render(<SubjectThemes subject={subject} onClose={jest.fn()} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Frações")).toBeVisible();
  expect(screen.getByLabelText("Novo tema")).toHaveAttribute("maxlength", "40");
  fireEvent.change(screen.getByLabelText("Novo tema"), { target: { value: "  Álgebra  " } });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar tema" }));
  await waitFor(() => expect(quizzesApi.createTheme).toHaveBeenCalledWith(2, 4, "Álgebra"));
  expect(await screen.findByText("Álgebra")).toBeVisible();
  expect(screen.getByLabelText("Novo tema")).toHaveValue("");
});

test("não envia espaços ou números sem letras e permite fechar a modal", async () => {
  const close = jest.fn();
  render(<SubjectThemes subject={subject} onClose={close} />, { wrapper: queryWrapper().wrapper });
  await screen.findByText("Frações");
  for (const value of ["   ", "123"]) {
    fireEvent.change(screen.getByLabelText("Novo tema"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar tema" }));
    expect(screen.getByRole("alert")).toBeVisible();
  }
  expect(quizzesApi.createTheme).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Fechar temas" }));
  expect(close).toHaveBeenCalledTimes(1);
});

test("formulário fica acima dos resultados e o botão remove o tema pela API", async () => {
  render(<SubjectThemes subject={subject} onClose={jest.fn()} />, { wrapper: queryWrapper().wrapper });
  await screen.findByText("Frações");
  const list = screen.getByRole("region", { name: "Temas cadastrados" });
  expect(screen.getByLabelText("Novo tema").compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remover tema Frações" }));
  await waitFor(() => expect(quizzesApi.removeTheme).toHaveBeenCalledWith(2, 4, "Frações"));
  await waitFor(() => expect(screen.queryByText("Frações")).not.toBeInTheDocument());
});

test("exibe falha de exclusão e mantém o tema na lista", async () => {
  jest.mocked(quizzesApi.removeTheme).mockRejectedValueOnce(new Error("Tema em uso"));
  render(<SubjectThemes subject={subject} onClose={jest.fn()} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("button", { name: "Remover tema Frações" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Tema em uso");
  expect(screen.getByText("Frações")).toBeVisible();
});

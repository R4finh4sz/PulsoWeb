import { SubjectForm } from "@/components/screens/ClassroomDetails/CreateSubject";
import { SubjectSyllabus } from "@/components/screens/ClassroomDetails/SubjectSyllabus";
import { subjectsApi } from "@/integrations/subjects/api";
import { CreateSubjectSchema } from "@/validation/Subject.validation";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { queryWrapper, router } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/subjects/api", () => ({ MAX_SUBJECTS: 7, subjectsApi: { list: jest.fn(), create: jest.fn() } }));
jest.mock("@/integrations/classrooms/hooks", () => ({ useClassroom: () => ({ data: { id: 5, name: "1º ano C" }, isPending: false, error: null }) }));
jest.mock("@/components/screens/Dashboard/TeacherShell", () => ({ TeacherShell: ({ children }: { children: React.ReactNode; }) => children }));
const topic = { title: "Frações", description: "Representações e operações.", references: "Autor. Livro. 2025." };
beforeEach(() => {
  jest.mocked(subjectsApi.list).mockResolvedValue([]);
  jest.mocked(subjectsApi.create).mockResolvedValue({ id: 200, classroomId: 5, teacherId: 3, name: "Matemática", syllabus: "Números", topics: [topic] });
});

async function show(canSave = true) {
  render(<SubjectForm classroomId={5} canSave={canSave} />, { wrapper: queryWrapper().wrapper });
  await screen.findByRole("heading", { name: "Nova disciplina" });
}

test("começa com um tópico, adiciona até 15 e permite remover um espaço vazio", async () => {
  await show();
  expect(screen.getByRole("heading", { name: "Ementa" })).toBeVisible();
  expect(screen.queryByPlaceholderText("O que os alunos vão estudar e aprender?")).toBeNull();
  expect(screen.getAllByLabelText("Título")).toHaveLength(1);
  expect(screen.getByRole("heading", { name: "1º tópico" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Remover tópico 1" })).toBeDisabled();
  for (let index = 1; index < 15; index++) fireEvent.click(screen.getByRole("button", { name: "Adicionar tópico" }));
  expect(screen.getAllByLabelText("Título")).toHaveLength(15);
  expect(screen.getByRole("heading", { name: "2º tópico" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Adicionar tópico" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Remover tópico 15" }));
  expect(screen.getAllByLabelText("Título")).toHaveLength(14);
  expect(screen.getByRole("button", { name: "Adicionar tópico" })).toBeEnabled();
});

test("exige tópico completo e salva referências, descartando o segundo tópico vazio", async () => {
  await show();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar tópico" }));
  fireEvent.change(screen.getByLabelText(/Nome da disciplina/), { target: { value: " Matemática " } });
  fireEvent.submit(screen.getByRole("form", { name: "Criar disciplina" }));
  expect(screen.getByRole("alert")).toHaveTextContent("ao menos um tópico");
  fireEvent.change(screen.getAllByLabelText("Título")[0], { target: { value: topic.title } });
  fireEvent.submit(screen.getByRole("form", { name: "Criar disciplina" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Descreva");
  fireEvent.change(screen.getAllByLabelText("Descrição")[0], { target: { value: topic.description } });
  fireEvent.change(screen.getAllByLabelText(/Referências bibliográficas/)[0], { target: { value: topic.references } });
  fireEvent.submit(screen.getByRole("form", { name: "Criar disciplina" }));
  await waitFor(() => expect(subjectsApi.create).toHaveBeenCalledWith(5, { name: "Matemática", syllabus: "", topics: [topic] }));
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/teacher/classrooms/5/subjects/200"));
});

test("falha ao salvar preserva conteúdo e permite tentar novamente", async () => {
  jest.mocked(subjectsApi.create).mockRejectedValueOnce(new Error("Falha temporária"));
  await show();
  fireEvent.change(screen.getByLabelText(/Nome da disciplina/), { target: { value: "Matemática" } });
  fireEvent.change(screen.getAllByLabelText("Título")[0], { target: { value: topic.title } });
  fireEvent.change(screen.getAllByLabelText("Descrição")[0], { target: { value: topic.description } });
  fireEvent.submit(screen.getByRole("form", { name: "Criar disciplina" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha temporária");
  expect(screen.getAllByLabelText("Descrição")[0]).toHaveValue(topic.description);
  expect(screen.getByRole("button", { name: "Criar disciplina" })).toBeEnabled();
});

test("mostra erros abaixo dos campos corretos mesmo após ignorar ou remover tópicos", async () => {
  await show();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar tópico" }));
  const titles = screen.getAllByLabelText("Título");
  fireEvent.change(titles[1], { target: { value: "123" } });
  fireEvent.submit(screen.getByRole("form", { name: "Criar disciplina" }));
  const name = screen.getByLabelText(/Nome da disciplina/);
  const descriptions = screen.getAllByLabelText("Descrição");
  expect(name).toHaveAttribute("aria-invalid", "true");
  expect(name).toHaveAccessibleDescription("Informe o nome da disciplina.");
  expect(titles[0]).toHaveAttribute("aria-invalid", "false");
  expect(titles[1]).toHaveAttribute("aria-invalid", "true");
  expect(titles[1]).toHaveAccessibleDescription(/O tema deve conter pelo menos uma letra/);
  expect(descriptions[1]).toHaveAccessibleDescription("Descreva o conteúdo do tópico.");
  const descriptionError = document.getElementById(descriptions[1].getAttribute("aria-describedby")!);
  expect(descriptions[1].parentElement?.nextElementSibling).toBe(descriptionError);
  fireEvent.change(name, { target: { value: "Matemática" } });
  expect(name).toHaveAttribute("aria-invalid", "false");
  expect(titles[1]).toHaveAttribute("aria-invalid", "true");
  fireEvent.click(screen.getByRole("button", { name: "Remover tópico 1" }));
  expect(screen.getByLabelText("Título")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Descrição")).toHaveAccessibleDescription("Descreva o conteúdo do tópico.");
});

test("impede salvar fora da demonstração e na turma com sete disciplinas", async () => {
  await show(false);
  expect(screen.getByRole("button", { name: "Criar disciplina" })).toBeDisabled();
  fireEvent.submit(screen.getByRole("form", { name: "Criar disciplina" }));
  expect(subjectsApi.create).not.toHaveBeenCalled();
});

test("turma cheia impede novo cadastro", async () => {
  jest.mocked(subjectsApi.list).mockResolvedValue(Array.from({ length: 7 }, (_, id) => ({ id, name: "Disciplina", classroomId: 5, teacherId: 3 })));
  await show();
  expect(screen.getByRole("alert")).toHaveTextContent("limite de 7");
  expect(screen.getByRole("button", { name: "Criar disciplina" })).toBeDisabled();
});

test("confirma saída para evitar descartar o preenchimento", async () => {
  await show();
  fireEvent.change(screen.getByLabelText(/Nome da disciplina/), { target: { value: "Matemática" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("Sair da criação da disciplina?")).toBeVisible();
  fireEvent.click(within(dialog).getByRole("button", { name: "Continuar editando" }));
  expect(screen.getByLabelText(/Nome da disciplina/)).toHaveValue("Matemática");
});

test("usa a modal do projeto para cancelar ou confirmar a remoção de um tópico preenchido", async () => {
  await show();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar tópico" }));
  fireEvent.change(screen.getAllByLabelText("Título")[0], { target: { value: "Frações" } });
  fireEvent.click(screen.getByRole("button", { name: "Remover tópico 1" }));
  let dialog = screen.getByRole("dialog", { name: "Remover tópico?" });
  expect(screen.getAllByLabelText("Título")).toHaveLength(2);
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog", { name: "Remover tópico?" })).toBeNull();
  expect(screen.getAllByLabelText("Título")[0]).toHaveValue("Frações");
  fireEvent.click(screen.getByRole("button", { name: "Remover tópico 1" }));
  dialog = screen.getByRole("dialog", { name: "Remover tópico?" });
  fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
  expect(screen.getAllByLabelText("Título")[0]).toHaveValue("Frações");
  fireEvent.click(screen.getByRole("button", { name: "Remover tópico 1" }));
  dialog = screen.getByRole("dialog", { name: "Remover tópico?" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Remover tópico" }));
  expect(screen.getAllByLabelText("Título")).toHaveLength(1);
  expect(screen.getByLabelText("Título")).toHaveValue("");
  expect(screen.queryByRole("dialog", { name: "Remover tópico?" })).toBeNull();
});

test("valida limite, títulos distintos e referências opcionais", () => {
  const body = { name: "Matemática", syllabus: "", topics: [topic] };
  expect(CreateSubjectSchema.safeParse({ ...body, topics: [{ ...topic, references: "" }] }).success).toBe(true);
  expect(CreateSubjectSchema.safeParse({ ...body, topics: [topic, { ...topic, title: " frações " }] }).success).toBe(false);
  expect(CreateSubjectSchema.safeParse({ ...body, topics: Array.from({ length: 16 }, (_, index) => ({ ...topic, title: `Tema ${index}` })) }).success).toBe(false);
  expect(CreateSubjectSchema.safeParse({ ...body, topics: [{ ...topic, title: "123" }] }).success).toBe(false);
});

test("mostra ementa e referências na consulta da disciplina", () => {
  render(<SubjectSyllabus subject={{ id: 200, classroomId: 5, teacherId: 3, name: "Matemática", syllabus: "Números", topics: [topic] }} />);
  fireEvent.click(screen.getByText("Ementa da disciplina"));
  expect(screen.getByText(topic.references)).toBeVisible();
  expect(screen.getByText(topic.description)).toBeVisible();
});

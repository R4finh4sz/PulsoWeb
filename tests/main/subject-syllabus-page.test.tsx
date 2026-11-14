import { SyllabusContent } from "@/components/screens/ClassroomDetails/SubjectSyllabus/Content";
import { subjectsApi } from "@/integrations/subjects/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { queryWrapper, router } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/subjects/api", () => ({
  MAX_SUBJECTS: 7,
  subjectsApi: { list: jest.fn(), updateSyllabus: jest.fn() },
}));
jest.mock("@/integrations/classrooms/hooks", () => ({
  useClassroom: () => ({ data: { id: 5, name: "1º ano A" }, isPending: false }),
}));
const topic = {
  title: "Frações",
  description: "Operações com frações.",
  references: "Livro, 2025.",
};
const subject = {
  id: 20,
  classroomId: 5,
  teacherId: 3,
  teacherIds: [3, 4],
  name: "Matemática",
  syllabus: "Texto original",
  topics: [topic],
};

beforeEach(() => {
  jest.mocked(subjectsApi.list).mockReset().mockResolvedValue([subject]);
  jest
    .mocked(subjectsApi.updateSyllabus)
    .mockReset()
    .mockImplementation(async (_classroomId, _subjectId, body) => {
      const saved = { ...subject, ...body };
      jest.mocked(subjectsApi.list).mockResolvedValue([saved]);
      return saved;
    });
});

function show(teacherId = 3) {
  return render(
    <SyllabusContent classroomId={5} subjectId={20} teacherId={teacherId} />,
    { wrapper: queryWrapper().wrapper },
  );
}

test("ementa abre em página com tópicos e referências visíveis", async () => {
  show();
  expect(await screen.findByText(topic.description)).toBeVisible();
  expect(screen.getByText(topic.references)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(router.back).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Editar ementa" })).toBeVisible();
});

test("responsável edita ementa mesmo com sete disciplinas e atualiza o texto sem alterar o nome", async () => {
  jest
    .mocked(subjectsApi.list)
    .mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => ({ ...subject, id: 20 + index })),
    );
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Editar ementa" }));
  expect(screen.getByLabelText(/Nome da disciplina/)).toHaveAttribute(
    "readonly",
  );
  fireEvent.change(screen.getByLabelText("Descrição"), {
    target: { value: "Descrição atualizada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() =>
    expect(subjectsApi.updateSyllabus).toHaveBeenCalledWith(5, 20, {
      name: subject.name,
      syllabus: "Descrição atualizada",
      topics: [{ ...topic, description: "Descrição atualizada" }],
    }),
  );
  expect(await screen.findByText("Descrição atualizada")).toBeVisible();
  expect(screen.getByRole("button", { name: "Editar ementa" })).toBeVisible();
});

test("erro do servidor preserva o que foi editado para nova tentativa", async () => {
  jest
    .mocked(subjectsApi.updateSyllabus)
    .mockRejectedValueOnce(new Error("Edição indisponível no servidor."));
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Editar ementa" }));
  fireEvent.change(screen.getByLabelText("Descrição"), {
    target: { value: "Não perder este texto" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Edição indisponível",
  );
  expect(screen.getByLabelText("Descrição")).toHaveValue(
    "Não perder este texto",
  );
});

test("professor convidado pode editar e professor sem vínculo não acessa", async () => {
  const view = show(4);
  expect(await screen.findByText(topic.description)).toBeVisible();
  expect(screen.getByRole("button", { name: "Editar ementa" })).toBeVisible();
  view.rerender(
    <SyllabusContent classroomId={5} subjectId={20} teacherId={9} />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("não vinculada");
});

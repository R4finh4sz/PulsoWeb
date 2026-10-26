import { CoordinatorClassroom } from "@/components/screens/ClassroomDetails/CoordinatorClassroom";
import { classroomsApi } from "@/integrations/classrooms/api";
import { subjectsApi } from "@/integrations/subjects/api";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { queryWrapper, router } from "../helpers";
jest.mock("next/navigation", () => ({ useRouter: () => router }));

jest.mock("@/integrations/classrooms/api", () => ({ classroomsApi: { students: jest.fn(), unenroll: jest.fn(), teachers: jest.fn(), unassign: jest.fn(), remove: jest.fn() } }));
jest.mock("@/integrations/subjects/api", () => ({ subjectsApi: { list: jest.fn() } }));
const room = { id: 1, name: "1º ano A", identifier: "1A", teacherIds: [3], schoolId: 1 };
const students = [
  { id: 1, fullName: "Ana Silva", email: "ana@exemplo.com", ra: "001", role: "STUDENT" as const, classroomId: 1 },
  { id: 2, fullName: "Bruno Costa", email: "bruno@exemplo.com", ra: "002", role: "STUDENT" as const, classroomId: 1 },
];
beforeEach(() => {
  jest.mocked(classroomsApi.remove).mockReset().mockResolvedValue(undefined);
  jest.mocked(classroomsApi.teachers).mockResolvedValue([{ id: 3, fullName: "Paulo Souza", email: "paulo@exemplo.com", ra: "P003", role: "TEACHER", classroomId: null }]);
  jest.mocked(subjectsApi.list).mockResolvedValue([{ id: 1, name: "Matemática", teacherId: 3, classroomId: 1 }]);
  jest.mocked(classroomsApi.students).mockReset().mockResolvedValue(students);
  jest.mocked(classroomsApi.unenroll).mockReset().mockImplementation(async () => {
    jest.mocked(classroomsApi.students).mockResolvedValue([students[1]]);
  });
});
test("exclusão da sala exige o nome e retorna à home após excluir", async () => {
  show();
  fireEvent.click(screen.getByRole("button", { name: "Dados da turma" }));
  fireEvent.click(screen.getByRole("button", { name: "Excluir sala" }));
  expect(screen.getByRole("button", { name: "Confirmar exclusão" })).toBeDisabled();
  expect(classroomsApi.remove).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("textbox", { name: "Nome da turma" }), { target: { value: room.name } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  await waitFor(() => expect(classroomsApi.remove).toHaveBeenCalledWith(1));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/coordinator"));
});
function show() {
  render(<CoordinatorClassroom room={room} studentsAssignment={<p>Formulário de vínculo</p>} teachers={<p>Formulário de vínculo de professor</p>} edit={<p>Editar turma</p>} />, { wrapper: queryWrapper().wrapper });
}

test("seleciona alunos, busca por RA e mantém professores e matérias em áreas próprias", async () => {
  show();
  expect(await screen.findByRole("region", { name: "Perfil de Ana Silva" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Editar dados" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Bruno Costa/ }));
  expect(screen.getByRole("region", { name: "Perfil de Bruno Costa" })).toBeVisible();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "001" } });
  expect(screen.getByRole("region", { name: "Perfil de Ana Silva" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Professores" }));
  expect(await screen.findByRole("region", { name: "Perfil de Paulo Souza" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Editar dados" })).not.toBeInTheDocument();
  expect(screen.getByRole("searchbox", { name: /Buscar professor/ })).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Perfil de Paulo Souza" })).getByText("Matemática")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Matérias" }));
  expect(await screen.findByRole("region", { name: "Detalhes de Matemática" })).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Detalhes de Matemática" })).getByText("Paulo Souza")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Alunos" }));
  fireEvent.click(screen.getByRole("button", { name: "Vincular aluno" }));
  expect(screen.getByText("Formulário de vínculo")).toBeVisible();
});

test("remove somente o vínculo do aluno selecionado e atualiza a lista", async () => {
  show();
  const profile = await screen.findByRole("region", { name: "Perfil de Ana Silva" });
  fireEvent.click(within(profile).getByRole("button", { name: "Remover da turma" }));
  expect(classroomsApi.unenroll).not.toHaveBeenCalled();
  fireEvent.click(within(profile).getByRole("button", { name: "Confirmar remoção" }));
  await waitFor(() => expect(classroomsApi.unenroll).toHaveBeenCalledWith(1, 1));
  expect(await screen.findByRole("region", { name: "Perfil de Bruno Costa" })).toBeVisible();
  expect(screen.queryByRole("button", { name: /Ana Silva/ })).not.toBeInTheDocument();
});

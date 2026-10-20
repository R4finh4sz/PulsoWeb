import { fireEvent, render, screen, within } from "@testing-library/react";
import { CoordinatorHome } from "@/components/screens/CoordinatorHome";
import { CoordinatorNotifications } from "@/components/screens/Dashboard/CoordinatorNotifications";
import { authApi } from "@/integrations/auth/api";
import { classroomsApi } from "@/integrations/classrooms/api";
import { registrationApi } from "@/integrations/registration/api";
import { queryWrapper, router } from "../helpers";
jest.mock("@/integrations/profile/deletions", () => ({ accountDeletionsApi: { list: jest.fn(async () => []) } }));

jest.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/coordinator" }));
jest.mock("@/integrations/auth/api", () => ({ authApi: { me: jest.fn(), logout: jest.fn() } }));
jest.mock("@/integrations/classrooms/api", () => ({ classroomsApi: { list: jest.fn() } }));
jest.mock("@/integrations/registration/api", () => ({ registrationApi: { list: jest.fn() } }));

beforeEach(() => {
  jest.mocked(authApi.me).mockResolvedValue({ id: 2, fullName: "Carla Costa", email: "carla@exemplo.com", ra: "002", role: "PEDAGOGICAL_COORDINATOR", classroomId: null, schoolId: 1 });
  jest.mocked(classroomsApi.list).mockResolvedValue([
    { id: 1, name: "6º ano", identifier: "A", teacherIds: [3], schoolId: 1 },
    { id: 2, name: "7º ano", identifier: "B", teacherIds: [], schoolId: 1 },
    { id: 3, name: "Outra escola", identifier: "C", teacherIds: [], schoolId: 2 },
  ]);
  jest.mocked(registrationApi.list).mockResolvedValue({ content: [], totalPages: 0 });
});

test("início do coordenador preserva acessos e filtra turmas da sua escola", async () => {
  render(<CoordinatorHome />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("link", { name: /6º ano/ })).toBeVisible();
  expect(screen.queryByRole("link", { name: /Outra escola/ })).not.toBeInTheDocument();
  const nav = screen.getByRole("navigation", { name: "Navegação principal" });
  expect(within(nav).queryByRole("link", { name: "Turmas" })).not.toBeInTheDocument();
  for (const [name, href] of [["Alunos", "/coordinator/students"], ["Professores", "/coordinator/teachers"], ["Solicitações", "/coordinator/registration-requests"]]) {
    expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
  }
  expect(screen.getByRole("link", { name: "Meu perfil" })).toHaveAttribute("href", "/coordinator/profile");
  expect(screen.queryByText("Quizzes criados")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "UNASSIGNED" } });
  expect(screen.queryByRole("link", { name: /6º ano/ })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /7º ano/ })).toBeVisible();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ausente" } });
  expect(screen.getByText("Nenhuma turma encontrada com estes filtros.")).toBeVisible();
});

test("sino leva às solicitações pendentes e fecha com Escape devolvendo foco", async () => {
  jest.mocked(registrationApi.list).mockResolvedValue({ content: [{ id: 1, name: "Ana Silva", email: "ana@exemplo.com", ra: "001", birthDate: null, role: "STUDENT", schoolName: "Escola", status: "PENDING", reviewReason: null, hasPhoto: false }], totalPages: 1 });
  render(<CoordinatorNotifications />, { wrapper: queryWrapper().wrapper });
  const trigger = await screen.findByRole("button", { name: /há cadastros aguardando análise/ });
  fireEvent.click(trigger);
  expect(screen.getByRole("link", { name: /Ana Silva/ })).toHaveAttribute("href", "/coordinator/registration-requests");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("region", { name: "Notificações do coordenador" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test("falha nas notificações permite tentar novamente", async () => {
  jest.mocked(registrationApi.list).mockRejectedValueOnce(new Error("Offline"));
  render(<CoordinatorNotifications />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(screen.getByRole("button", { name: "Notificações" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Nenhuma solicitação aguardando análise.")).toBeVisible();
});

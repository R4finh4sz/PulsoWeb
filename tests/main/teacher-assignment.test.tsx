import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Assignment } from "@/components/screens/Integration/Classrooms";
import { usersApi } from "@/integrations/users/api";
import { classroomsApi } from "@/integrations/classrooms/api";
import { queryWrapper } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => "/coordinator/classrooms/1" }));
jest.mock("@/integrations/users/api", () => ({ usersApi: { list: jest.fn() } }));
jest.mock("@/integrations/classrooms/api", () => ({ classroomsApi: { assign: jest.fn() } }));
const room = { id: 1, name: "Turma A", identifier: "A", schoolId: 8, teacherIds: [2] };
const teacher = { id: 3, fullName: "Rafinhas Santana", email: "rafa@example.com", ra: "1000", role: "TEACHER" as const, classroomId: null };
beforeEach(() => {
  jest.mocked(classroomsApi.assign).mockResolvedValue({ ...room, teacherIds: [2, 3] });
  jest.mocked(usersApi.list).mockImplementation(async (_resource, filters) => ({
    content: filters?.page === 1 ? [teacher] : [{ ...teacher, id: 2, fullName: "Já vinculado" }],
    page: filters?.page ?? 0, size: 100, totalElements: 2, totalPages: 2,
  }));
});

test("busca professor da escola em todas as páginas e permite selecioná-lo e vinculá-lo", async () => {
  const { container } = render(<Assignment room={room} resource="teachers" />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Rafinhas Santana")).toBeVisible();
  expect(usersApi.list).toHaveBeenCalledWith("teachers", { page: 1, size: 100 }, expect.any(AbortSignal));
  expect(screen.queryByText("Já vinculado")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(container.querySelector("form")).not.toHaveClass("bg-slate-50");
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar professor da escola" }), { target: { value: "Ráfinhas" } });
  fireEvent.click(screen.getByRole("radio"));
  fireEvent.click(screen.getByRole("button", { name: "Vincular" }));
  await waitFor(() => expect(classroomsApi.assign).toHaveBeenCalledWith(1, 3));
});

test("busca sem resultado informa o motivo e impede vínculo", async () => {
  render(<Assignment room={room} resource="teachers" />, { wrapper: queryWrapper().wrapper });
  await screen.findByText("Rafinhas Santana");
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar professor da escola" }), { target: { value: "Ausente" } });
  expect(screen.getByRole("status")).toHaveTextContent("Nenhum professor disponível");
  expect(screen.getByRole("button", { name: "Vincular" })).toBeDisabled();
});

test("pesquisa por matrícula do contrato real e orienta quando a API retorna lista vazia", async () => {
  jest.mocked(usersApi.list).mockResolvedValue({ content: [{ ...teacher, ra: "", matricula: "1000" }], page: 0, size: 100, totalElements: 1, totalPages: 1 });
  const { unmount } = render(<Assignment room={room} resource="teachers" />, { wrapper: queryWrapper().wrapper });
  await screen.findByText("Rafinhas Santana");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "1000" } });
  expect(screen.getByText("Rafinhas Santana")).toBeVisible();
  unmount();
  jest.mocked(usersApi.list).mockResolvedValue({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
  render(<Assignment room={room} resource="teachers" />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText(/A API não retornou professores/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Ver solicitações de professores" })).toHaveAttribute("href", "/coordinator/registration-requests");
});

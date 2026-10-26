import { fireEvent, render, screen } from "@testing-library/react";
import { ClassroomList } from "@/components/screens/Integration/Classrooms";
import { classroomsApi } from "@/integrations/classrooms/api";
import { useAuthState } from "@/integrations/auth/state";
import { queryWrapper, router, session } from "../helpers";

const selectSchool = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/teacher/classrooms" }));
jest.mock("@/integrations/auth/hooks", () => ({ useActiveSchool: () => ({ mutate: selectSchool, isPending: false, error: null }) }));
jest.mock("@/integrations/classrooms/api", () => ({ classroomsApi: { teacherList: jest.fn(), list: jest.fn() } }));
const rooms = [
  { id: 1, name: "Turma A", identifier: "A", schoolId: 1, schoolName: "Escola Horizonte", teacherIds: [3] },
  { id: 2, name: "Turma B", identifier: "B", schoolId: 2, schoolName: "Escola Central", teacherIds: [3] },
];
const teacher = { id: "3", name: "Professor", email: "teacher@test.com", role: "professor" as const };
beforeEach(() => {
  useAuthState.getState().setSession({ ...session, user: { ...session.user, role: "TEACHER", schoolId: 1 } });
  jest.mocked(classroomsApi.teacherList).mockResolvedValue(rooms);
  jest.mocked(classroomsApi.list).mockResolvedValue([rooms[0]]);
});
afterEach(() => useAuthState.getState().setSession(null));

test("minhas turmas consulta todas as escolas e identifica cada cartão", async () => {
  render(<ClassroomList user={teacher} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Escola Horizonte")).toBeVisible();
  expect(screen.getByText("Escola Central")).toBeVisible();
  expect(classroomsApi.teacherList).toHaveBeenCalled();
  expect(classroomsApi.list).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Central" } });
  expect(screen.getByText("Turma B")).toBeVisible();
  expect(screen.queryByText("Turma A")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: /Turma B/ }));
  expect(selectSchool).toHaveBeenCalledWith(2, expect.objectContaining({ onSuccess: expect.any(Function) }));
});

test("lista da escola selecionada filtra todas as turmas sem depender da escola ativa", async () => {
  render(<ClassroomList user={teacher} schoolId={2} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Escola Central")).toBeVisible();
  expect(screen.getByText("Turma B")).toBeVisible();
  expect(screen.queryByText("Turma A")).not.toBeInTheDocument();
  expect(classroomsApi.teacherList).toHaveBeenCalled();
  expect(classroomsApi.list).not.toHaveBeenCalled();
  expect(selectSchool).not.toHaveBeenCalled();
});

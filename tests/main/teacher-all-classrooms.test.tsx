import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ClassroomList } from "@/components/screens/Integration/Classrooms";
import { classroomsApi } from "@/integrations/classrooms/api";
import { useAuthState } from "@/integrations/auth/state";
import { queryWrapper, router, session, teacher } from "../helpers";

const mockActivate = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/auth/hooks", () => ({
  useActiveSchool: () => ({ mutate: mockActivate, isPending: false }),
}));
jest.mock("@/integrations/classrooms/api", () => ({
  classroomsApi: { teacherList: jest.fn() },
}));
beforeEach(() => {
  mockActivate.mockReset();
  useAuthState.getState().setSession({
    ...session,
    user: { ...session.user, role: "TEACHER", schoolId: 1 },
  });
  jest.mocked(classroomsApi.teacherList).mockResolvedValue([
    {
      id: 2,
      name: "1º ano A",
      identifier: "A",
      teacherIds: [3],
      schoolId: 1,
      schoolName: "Escola Central",
    },
    {
      id: 8,
      name: "3º ano B",
      identifier: "B",
      teacherIds: [3],
      schoolId: 9,
      schoolName: "Escola Norte",
    },
  ]);
});
afterEach(() => useAuthState.getState().setSession(null));

test("Minhas Turmas mostra todas as escolas e permite buscar pela escola", async () => {
  render(<ClassroomList user={teacher} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Escola Central")).toBeVisible();
  expect(screen.getByText("Escola Norte")).toBeVisible();
  expect(classroomsApi.teacherList).toHaveBeenCalledWith(
    expect.any(AbortSignal),
  );
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Norte" },
  });
  expect(screen.queryByText("Escola Central")).not.toBeInTheDocument();
  expect(screen.getByText("Escola Norte")).toBeVisible();
});

test("troca escola somente ao abrir turma de outra escola e aguarda confirmação", async () => {
  render(<ClassroomList user={teacher} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("link", { name: /3º ano B/ }));
  expect(mockActivate).toHaveBeenCalledWith(
    9,
    expect.objectContaining({ onSuccess: expect.any(Function) }),
  );
  expect(router.push).not.toHaveBeenCalled();
  mockActivate.mock.calls[0][1].onSuccess();
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith("/teacher/classrooms/8"),
  );
});

test("página de uma escola mantém o filtro pela escola escolhida", async () => {
  render(<ClassroomList user={teacher} schoolId={9} />, {
    wrapper: queryWrapper().wrapper,
  });
  expect(await screen.findByText("Escola Norte")).toBeVisible();
  expect(screen.queryByText("Escola Central")).not.toBeInTheDocument();
});

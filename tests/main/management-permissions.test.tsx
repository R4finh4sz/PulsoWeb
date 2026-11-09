import { render, screen } from "@testing-library/react";
import {
  ClassroomList,
  Details,
} from "@/components/screens/Integration/Classrooms";
import {
  ErrorMessage,
  Protected,
  schoolRequiredMessage,
} from "@/components/screens/Integration/shared";
import { ApiError } from "@/api/client";
import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";
import { classroomsApi } from "@/integrations/classrooms/api";
import { admin, queryWrapper, session } from "../helpers";

let pathname = "/coordinator/classrooms";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => pathname,
}));
jest.mock("@/components/screens/Dashboard/DashboardShell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
jest.mock("@/integrations/auth/api", () => ({ authApi: { me: jest.fn() } }));
jest.mock("@/integrations/classrooms/api", () => ({
  classroomsApi: {
    list: jest.fn(),
    get: jest.fn(),
    students: jest.fn(),
    teachers: jest.fn(),
  },
}));
const coordinator = {
  id: 2,
  fullName: "Ana Silva",
  ra: "2",
  email: "ana@example.com",
  role: "PEDAGOGICAL_COORDINATOR" as const,
  schoolId: null,
  classroomId: null,
};
beforeEach(() => {
  useAuthState
    .getState()
    .setSession({
      ...session,
      user: { ...session.user, role: "PEDAGOGICAL_COORDINATOR" },
    });
  jest.mocked(authApi.me).mockResolvedValue(coordinator);
});
afterEach(() => useAuthState.getState().setSession(null));

test.each([
  "/coordinator/classrooms",
  "/coordinator/classrooms/new",
  "/coordinator/classrooms/1",
  "/coordinator/students",
  "/coordinator/students/new",
  "/coordinator/teachers",
  "/coordinator/teachers/new",
])("blocks management without school at %s", async (path) => {
  pathname = path;
  const child = jest.fn(() => <p>Private management</p>);
  render(<Protected role="coordenador">{child}</Protected>, {
    wrapper: queryWrapper().wrapper,
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    schoolRequiredMessage,
  );
  expect(child).not.toHaveBeenCalled();
});
test("linked coordinator keeps access", async () => {
  jest.mocked(authApi.me).mockResolvedValue({ ...coordinator, schoolId: 1 });
  render(
    <Protected role="coordenador">{() => <p>Allowed management</p>}</Protected>,
    { wrapper: queryWrapper().wrapper },
  );
  expect(await screen.findByText("Allowed management")).toBeVisible();
});
test("API 403 explains school requirement for coordinator", () => {
  render(<ErrorMessage error={new ApiError(403, "Forbidden")} />);
  expect(screen.getByRole("alert")).toHaveTextContent(schoolRequiredMessage);
});
test("other API errors preserve their message", () => {
  render(<ErrorMessage error={new ApiError(500, "Server unavailable")} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Server unavailable");
});
test.each([ClassroomList, Details])(
  "administrator cannot fetch classrooms or participants",
  (Component) => {
    render(<Component user={admin} id={1} />, {
      wrapper: queryWrapper().wrapper,
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Acesso negado");
    expect(classroomsApi.list).not.toHaveBeenCalled();
    expect(classroomsApi.get).not.toHaveBeenCalled();
    expect(classroomsApi.students).not.toHaveBeenCalled();
    expect(classroomsApi.teachers).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Criar turma" })).toBeNull();
  },
);

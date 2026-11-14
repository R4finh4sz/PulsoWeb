import { render, screen, within } from "@testing-library/react";
import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import { teacher, router, queryWrapper } from "../helpers";
jest.mock("@/integrations/profile/api", () => ({ profileApi: { photo: jest.fn().mockResolvedValue(null) } }));

let mockPathname = "/teacher";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => router,
}));
jest.mock("@/integrations/auth/hooks", () => ({
  useLogout: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock("@/components/screens/Dashboard/TeacherNotifications", () => ({
  TeacherNotifications: () => null,
}));
jest.mock("@/components/screens/Login/DemoAccess", () => ({
  DemoAccess: () => null,
}));

test.each([
  ["/teacher", "Início"],
  ["/teacher/schools/3", "Início"],
  ["/teacher/classrooms", "Minhas Turmas"],
  ["/teacher/classrooms/2", "Início"],
  ["/teacher/classrooms/2/subjects/5", "Início"],
  ["/teacher/activities", "Atividades"],
])("navegação em %s destaca somente %s", (path, active) => {
  mockPathname = path;
  render(
    <TeacherShell user={teacher}>
      <p>Conteúdo da página</p>
    </TeacherShell>,
    { wrapper: queryWrapper().wrapper },
  );
  const navigation = within(
    screen.getByRole("navigation", { name: "Navegação principal" }),
  );
  const links = navigation.getAllByRole("link");
  expect(
    links.filter((link) => link.getAttribute("aria-current") === "page"),
  ).toEqual([navigation.getByRole("link", { name: active })]);
});

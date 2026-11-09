import { Profile } from "@/components/screens/TeacherProfile";
import { profileApi } from "@/integrations/profile/api";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { admin, queryWrapper, router } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/auth/hooks", () => ({
  useLogout: () => ({ isPending: false, mutateAsync: jest.fn() }),
}));
jest.mock("@/integrations/profile/api", () => ({
  profileApi: {
    get: jest.fn(),
    requestDeletion: jest.fn(),
    changePassword: jest.fn(),
    export: jest.fn(),
  },
}));

test("perfil do admin mostra dados da conta e não oferece exclusão ou vínculo escolar", async () => {
  jest.mocked(profileApi.get).mockResolvedValue({
    user: {
      id: 1,
      fullName: "Administrador da Rede",
      email: "admin@rede.com",
      role: "ADMIN",
      ra: "001",
      schoolId: null,
      classroomId: null,
    },
    schools: [],
    classrooms: [],
    deletionRequested: false,
  });
  render(<Profile user={admin} />, { wrapper: queryWrapper().wrapper });
  const data = within(
    screen.getByRole("region", { name: "Dados do administrador" }),
  );
  expect(await data.findByText("Administrador da Rede")).toBeVisible();
  expect(data.getByText("admin@rede.com")).toBeVisible();
  expect(data.getByText("Administrador")).toBeVisible();
  expect(data.queryByText("Escolas")).not.toBeInTheDocument();
  expect(data.queryByText("Matrícula")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Solicitar exclusão/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
  expect(
    within(screen.getByRole("dialog")).getByLabelText("Nova senha"),
  ).toBeVisible();
  expect(screen.queryByLabelText("Motivo da exclusão")).not.toBeInTheDocument();
  expect(profileApi.requestDeletion).not.toHaveBeenCalled();
});

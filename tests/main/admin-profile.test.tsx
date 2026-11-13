import { Profile } from "@/components/screens/TeacherProfile";
import { profileApi } from "@/integrations/profile/api";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { admin, queryWrapper, router } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/auth/hooks", () => ({
  useLogout: () => ({ isPending: false, mutateAsync: jest.fn() }),
}));
jest.mock("@/integrations/profile/api", () => ({
  profileApi: {
    photo: jest.fn().mockResolvedValue(undefined),
    updatePhoto: jest.fn().mockResolvedValue(undefined),
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
  expect(screen.getByText("Pelo menos 8 caracteres")).toHaveTextContent("Pendente:");
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "Password1" } });
  expect(screen.getByText("Pelo menos 8 caracteres")).toHaveClass("text-green-700");
  expect(screen.getByText("Uma letra maiúscula de A a Z")).toHaveClass("text-green-700");
  expect(screen.getByText("Um número")).toHaveClass("text-green-700");
  fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "Password1" } });
  expect(screen.getByText("As senhas são iguais")).toHaveClass("text-green-700");
  expect(
    within(screen.getByRole("dialog")).getByLabelText("Nova senha"),
  ).toBeVisible();
  expect(screen.queryByLabelText("Motivo da exclusão")).not.toBeInTheDocument();
  expect(profileApi.requestDeletion).not.toHaveBeenCalled();
});

test("perfil envia a foto escolhida e consulta novamente a imagem", async () => {
  jest.mocked(profileApi.photo).mockResolvedValue(new Blob(["image"], { type: "image/png" }));
  render(<Profile user={admin} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByAltText("Foto de perfil")).toHaveAttribute("src", "blob:test");
  const picker = screen.getByLabelText("Selecionar foto de perfil");
  const click = jest.spyOn(picker, "click");
  fireEvent.click(screen.getByRole("button", { name: "Alterar foto de perfil" }));
  expect(click).toHaveBeenCalled();
  const file = new File(["new image"], "foto.png", { type: "image/png" });
  const calls = jest.mocked(profileApi.photo).mock.calls.length;
  fireEvent.change(picker, { target: { files: [file] } });
  await waitFor(() => expect(profileApi.updatePhoto).toHaveBeenCalledWith(file, expect.anything()));
  await waitFor(() => expect(jest.mocked(profileApi.photo).mock.calls.length).toBeGreaterThan(calls));
});

import NewCoordinatorPage from "@/app/admin/coordinators/new/page";
import { schoolsApi } from "@/integrations/schools/api";
import { registrationApi } from "@/integrations/registration/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { admin, queryWrapper } from "../helpers";

jest.mock("@/components/screens/Dashboard/DashboardShell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/screens/Integration/shared", () => ({
  ...jest.requireActual("@/components/screens/Integration/shared"),
  Protected: ({
    children,
  }: {
    children: (user: typeof admin) => React.ReactNode;
  }) => children(admin),
  Workspace: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/integrations/schools/api", () => ({
  schoolsApi: { searchByCep: jest.fn(), list: jest.fn() },
}));
jest.mock("@/integrations/registration/api", () => ({
  registrationApi: { invite: jest.fn() },
}));

const result = {
  content: [
    {
      id: "7",
      name: "Escola do CEP",
      city: "São Paulo",
      state: "SP",
      cep: "01001000",
    },
  ],
  totalPages: 1,
};
beforeEach(() => {
  jest.mocked(schoolsApi.searchByCep).mockReset().mockResolvedValue(result);
  jest
    .mocked(registrationApi.invite)
    .mockReset()
    .mockResolvedValue({ delivery: "EMAIL" });
});

test("busca somente após CEP completo, envia escola escolhida e limpa seleção ao editar CEP", async () => {
  render(<NewCoordinatorPage />, { wrapper: queryWrapper().wrapper });
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(schoolsApi.list).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("CEP da escola"), {
    target: { value: "01001" },
  });
  expect(schoolsApi.searchByCep).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("CEP da escola"), {
    target: { value: "01001000" },
  });
  expect(
    await screen.findByRole("option", { name: "Escola do CEP · São Paulo/SP" }),
  ).toBeVisible();
  expect(schoolsApi.searchByCep).toHaveBeenCalledWith(
    "01001000",
    0,
    expect.any(AbortSignal),
  );
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "coord@escola.com" },
  });
  fireEvent.change(screen.getByLabelText("Escola"), { target: { value: "7" } });
  fireEvent.change(screen.getByLabelText("CEP da escola"), {
    target: { value: "01001" },
  });
  expect(screen.getByRole("button", { name: "Enviar convite" })).toBeDisabled();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("CEP da escola"), {
    target: { value: "01001000" },
  });
  await screen.findByRole("combobox");
  fireEvent.change(screen.getByLabelText("Escola"), { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));
  await waitFor(() =>
    expect(registrationApi.invite).toHaveBeenCalledWith("coordinators", {
      email: "coord@escola.com",
      schoolId: 7,
    }),
  );
});

test("busca por CEP permite recuperar erro e trata resultado vazio", async () => {
  jest
    .mocked(schoolsApi.searchByCep)
    .mockRejectedValueOnce(new Error("Busca indisponível"))
    .mockResolvedValue({ content: [], totalPages: 0 });
  render(<NewCoordinatorPage />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getByLabelText("CEP da escola"), {
    target: { value: "01001000" },
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Busca indisponível",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByText("Nenhuma escola cadastrada para este CEP."),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Enviar convite" })).toBeDisabled();
});

test("pagina escolas do CEP sem carregar todas", async () => {
  jest
    .mocked(schoolsApi.searchByCep)
    .mockResolvedValue({ ...result, totalPages: 2 });
  render(<NewCoordinatorPage />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getByLabelText("CEP da escola"), {
    target: { value: "01001000" },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));
  await waitFor(() =>
    expect(schoolsApi.searchByCep).toHaveBeenLastCalledWith(
      "01001000",
      1,
      expect.any(AbortSignal),
    ),
  );
});

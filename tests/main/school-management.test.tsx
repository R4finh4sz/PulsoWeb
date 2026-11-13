import { SchoolManagement } from "@/components/screens/SchoolManagement";
import { schoolsApi } from "@/integrations/schools/api";
import { usersApi } from "@/integrations/users/api";
import { useFeedbackStore } from "@/store/feedbackStore";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { queryWrapper, router } from "../helpers";

jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/integrations/schools/api", () => ({ schoolsApi: { deactivate: jest.fn(), assignUser: jest.fn(), assignCoordinator: jest.fn() } }));
jest.mock("@/integrations/users/api", () => ({ usersApi: { list: jest.fn() } }));
beforeEach(() => {
  useFeedbackStore.setState({ feedback: null });
  jest.mocked(schoolsApi.deactivate).mockResolvedValue(undefined);
  jest.mocked(schoolsApi.assignUser).mockResolvedValue({ id: 7 } as Awaited<ReturnType<typeof schoolsApi.assignUser>>);
  jest.mocked(schoolsApi.assignCoordinator).mockResolvedValue(undefined);
  jest.mocked(usersApi.list).mockResolvedValue({ content: [{ id: 7, fullName: "Ana", email: "ana@escola.com", ra: "7", role: "STUDENT", classroomId: null }], page: 0, size: 10, totalElements: 1, totalPages: 1 });
});

test.each(["students", "teachers", "coordinators"] as const)("admin vincula %s sem recriar a conta", async (resource) => {
  render(<SchoolManagement schoolId={3} />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getByLabelText("Tipo de usuário"), { target: { value: resource } });
  await screen.findByRole("option", { name: "Ana · ana@escola.com" });
  fireEvent.change(screen.getByLabelText("Usuário"), { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: "Vincular à escola" }));
  await waitFor(() => expect(resource === "coordinators" ? schoolsApi.assignCoordinator : schoolsApi.assignUser).toHaveBeenCalledWith(3, 7));
  await waitFor(() => expect(screen.getByLabelText("Usuário")).toHaveValue(""));
});

test("desativação exige confirmação e volta à lista após sucesso", async () => {
  const { client, wrapper } = queryWrapper();
  client.setQueryDefaults(["schools"], { gcTime: Infinity });
  client.setQueryData(["schools"], [{ id: 3 }]);
  render(<SchoolManagement schoolId={3} />, { wrapper });
  fireEvent.click(screen.getByRole("button", { name: "Desativar escola" }));
  expect(schoolsApi.deactivate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar desativação" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/admin/schools"));
  expect(schoolsApi.deactivate).toHaveBeenCalledWith(3);
  expect(client.getQueryState(["schools"])?.isInvalidated).toBe(true);
});

test("falha ao desativar mantém a escola aberta para nova tentativa", async () => {
  jest.mocked(schoolsApi.deactivate).mockRejectedValue(new Error("Falha ao desativar"));
  render(<SchoolManagement schoolId={3} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(screen.getByRole("button", { name: "Desativar escola" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar desativação" }));
  await waitFor(() => expect(useFeedbackStore.getState().feedback?.message).toContain("Falha ao desativar"));
  expect(router.replace).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Confirmar desativação" })).toBeEnabled();
});

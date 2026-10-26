import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AccountDeletions } from "@/components/screens/Registration/AccountDeletions";
import { accountDeletionsApi } from "@/integrations/profile/deletions";
import { queryWrapper } from "../helpers";

jest.mock("@/integrations/profile/deletions", () => ({ accountDeletionsApi: { list: jest.fn(), review: jest.fn() } }));
const request = { id: 6, name: "Ricardo Almeida", email: "ricardo@exemplo.com", role: "TEACHER" as const, reason: "Saí da escola.", createdAt: "2026-10-19T12:00:00Z", status: "PENDING" as const };
beforeEach(() => {
  jest.mocked(accountDeletionsApi.list).mockReset().mockResolvedValue([request]);
  jest.mocked(accountDeletionsApi.review).mockReset().mockImplementation(async () => { jest.mocked(accountDeletionsApi.list).mockResolvedValue([]); });
});

test("excluir uma conta exige confirmação e atualiza a fila", async () => {
  render(<AccountDeletions />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("button", { name: "Aprovar exclusão de Ricardo Almeida" }));
  expect(accountDeletionsApi.review).not.toHaveBeenCalled();
  expect(screen.getByText(/Esta ação não pode ser desfeita/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão da conta" }));
  await waitFor(() => expect(accountDeletionsApi.review).toHaveBeenCalledWith(6, "APPROVED"));
  expect(await screen.findByText("Nenhum pedido de exclusão nesta situação.")).toBeVisible();
});

test("recusa o pedido sem excluir a conta e permite buscar por nome", async () => {
  render(<AccountDeletions />, { wrapper: queryWrapper().wrapper });
  await screen.findByText("Ricardo Almeida");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ausente" } });
  expect(screen.getByText("Nenhum pedido encontrado com estes filtros.")).toBeVisible();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Ricardo" } });
  fireEvent.click(screen.getByRole("button", { name: "Recusar pedido de Ricardo Almeida" }));
  await waitFor(() => expect(accountDeletionsApi.review).toHaveBeenCalledWith(6, "REJECTED"));
});

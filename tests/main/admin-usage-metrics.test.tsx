import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { apiRequest } from "@/api/client";
import Page from "@/app/admin/metrics/page";
import type { ReactNode } from "react";

jest.mock("@/api/client", () => ({
  ...jest.requireActual("@/api/client"),
  apiRequest: jest.fn(),
}));
jest.mock("@/mocks/api", () => ({}));
jest.mock("@coreui/react-chartjs", () => ({ CChart: () => null }));
jest.mock("@/components/screens/Integration/shared", () => ({
  Protected: ({ children }: { children: (user: { role: string }) => ReactNode }) =>
    children({ role: "admin" }),
  Workspace: ({ children }: { children: ReactNode }) => children,
  ErrorMessage: () => null,
}));
jest.mock("@/components/ui/BackLink", () => ({ BackLink: () => null }));

test("switches between system and leads metrics and preserves the selected month", async () => {
  jest.mocked(apiRequest)
    .mockResolvedValueOnce({ current: null, history: [] })
    .mockResolvedValueOnce({
      month: null,
      totalUsers: 42,
      usersByRole: { STUDENT: 35, TEACHER: 4, PEDAGOGICAL_COORDINATOR: 2, ADMIN: 1 },
      demandByState: [{ state: "SP", requests: 8 }, { state: null, requests: 2 }],
    })
    .mockResolvedValueOnce({
      month: "2026-11",
      totalUsers: 0,
      usersByRole: { STUDENT: 0, TEACHER: 0, PEDAGOGICAL_COORDINATOR: 0, ADMIN: 0 },
      demandByState: [],
    });

  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })}>
      <Page />
    </QueryClientProvider>,
  );
  const system = screen.getByRole("button", { name: "Sistema" });
  const leads = screen.getByRole("button", { name: "Leads" });
  expect(system).toHaveAttribute("aria-pressed", "true");
  expect(await screen.findByText(/Aguardando a primeira amostra/)).toBeInTheDocument();
  expect(apiRequest).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText("Filtrar por mês")).not.toBeInTheDocument();

  fireEvent.click(leads);
  expect(leads).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("region", { name: "Métricas do sistema" })).not.toBeInTheDocument();
  expect(await screen.findByText("42")).toBeInTheDocument();
  expect(apiRequest).toHaveBeenCalledWith("/admin/metrics/usage", expect.anything());
  expect(screen.getByText("Alunos")).toBeInTheDocument();
  expect(screen.getByText("35")).toBeInTheDocument();
  expect(within(screen.getByText("SP").parentElement!).getByText("8")).toBeInTheDocument();
  expect(within(screen.getByText("UF não informada").parentElement!).getByText("2")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Filtrar por mês"), { target: { value: "2026-11" } });
  expect(await screen.findByText("Novos usuários no mês")).toBeInTheDocument();
  expect(apiRequest).toHaveBeenLastCalledWith("/admin/metrics/usage?month=2026-11", expect.anything());
  expect(screen.getByText("Nenhuma solicitação no período.")).toBeInTheDocument();

  fireEvent.click(system);
  fireEvent.click(leads);
  expect(screen.getByLabelText("Filtrar por mês")).toHaveValue("2026-11");

  const clear = screen.getByRole("button", { name: "Limpar filtro" });
  expect(clear).toBeEnabled();
  fireEvent.click(clear);
  expect(await screen.findByText("Total de usuários")).toBeInTheDocument();
  expect(clear).toBeDisabled();
});

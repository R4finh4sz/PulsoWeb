import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminRankingPage from "@/app/admin/ranking/page";
import { authApi } from "@/integrations/auth/api";
import { schoolsApi } from "@/integrations/schools/api";
import { studentRankingApi } from "@/integrations/ranking/students";
import { queryWrapper, router } from "../helpers";

jest.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/admin/ranking",
}));
jest.mock("@/integrations/auth/api", () => ({ authApi: { me: jest.fn() } }));
jest.mock("@/integrations/schools/api", () => ({
  schoolsApi: { list: jest.fn() },
}));
jest.mock("@/integrations/ranking/students", () => ({
  studentRankingApi: { list: jest.fn() },
}));

beforeEach(() => {
  jest
    .mocked(authApi.me)
    .mockResolvedValue({
      id: 1,
      fullName: "Admin",
      email: "a@b.com",
      ra: "1",
      role: "ADMIN",
      schoolId: null,
      classroomId: null,
    });
  jest
    .mocked(schoolsApi.list)
    .mockResolvedValue([
      { id: 7, nome: "Escola Sete", cidade: "", bairro: "", logradouro: "" },
    ]);
  jest
    .mocked(studentRankingApi.list)
    .mockReset()
    .mockResolvedValue([
      {
        position: 2,
        studentId: 4,
        studentName: "Ana",
        totalActivities: 3,
        totalScore: 20,
        averageScore: 6.67,
        correctAnswers: 8,
        totalQuestions: 10,
        accuracyPercentage: 80,
      },
    ]);
});

test("admin usa ranking real, preserva posições e filtra por escola e período", async () => {
  render(<AdminRankingPage />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Ana")).toBeVisible();
  expect(screen.getByText("2º")).toBeVisible();
  expect(screen.getByText("80%")).toBeVisible();
  expect(screen.queryByLabelText("Série")).not.toBeInTheDocument();
  expect(
    await screen.findByRole("option", { name: "Escola Sete" }),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Escola"), { target: { value: "7" } });
  fireEvent.change(screen.getByLabelText("Ano"), { target: { value: "2025" } });
  fireEvent.change(screen.getByLabelText("Bimestre"), {
    target: { value: "2" },
  });
  await waitFor(() =>
    expect(studentRankingApi.list).toHaveBeenLastCalledWith(
      { year: 2025, bimester: 2, schoolId: 7 },
      expect.any(AbortSignal),
    ),
  );
  fireEvent.change(screen.getByLabelText("Escola"), { target: { value: "" } });
  await waitFor(() =>
    expect(studentRankingApi.list).toHaveBeenLastCalledWith(
      { year: 2025, bimester: 2 },
      expect.any(AbortSignal),
    ),
  );
  const calls = jest.mocked(studentRankingApi.list).mock.calls.length;
  fireEvent.change(screen.getByLabelText("Ano"), { target: { value: "0" } });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Informe um ano entre 1 e 9999.",
  );
  expect(studentRankingApi.list).toHaveBeenCalledTimes(calls);
});

test("admin consegue recuperar erro e recebe estado vazio", async () => {
  jest
    .mocked(studentRankingApi.list)
    .mockRejectedValueOnce(new Error("Ranking indisponível"))
    .mockResolvedValue([]);
  render(<AdminRankingPage />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Ranking indisponível",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByText("Nenhuma atividade concluída neste bimestre."),
  ).toBeVisible();
});

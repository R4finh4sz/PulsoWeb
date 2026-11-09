import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CoordinatorRanking } from "@/components/screens/Ranking/CoordinatorRanking";
import { CoordinatorMetrics } from "@/components/screens/CoordinatorHome/Metrics";
import { TwoFactorSettings } from "@/components/screens/TeacherProfile/TwoFactorSettings";
import { studentRankingApi } from "@/integrations/ranking/students";
import { metricsApi } from "@/integrations/metrics/api";
import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";
import { queryWrapper, session } from "../helpers";

jest.mock("@/integrations/auth/api", () => ({
  authApi: { me: jest.fn(), updateTwoFactor: jest.fn() },
}));
jest.mock("@/integrations/ranking/students", () => ({
  studentRankingApi: { list: jest.fn() },
}));
jest.mock("@/integrations/metrics/api", () => ({
  metricsApi: { school: jest.fn() },
}));

beforeEach(() => {
  useAuthState.getState().setSession({ ...session, twoFactorEnabled: true });
  jest
    .mocked(authApi.me)
    .mockResolvedValue({
      id: 2,
      fullName: "Coord",
      email: "c@a.com",
      ra: "2",
      role: "PEDAGOGICAL_COORDINATOR",
      classroomId: null,
      schoolId: 7,
    });
});
afterEach(() => useAuthState.getState().setSession(null));

test("ranking preserva posição e percentual do backend e envia bimestre e escola", async () => {
  jest
    .mocked(studentRankingApi.list)
    .mockResolvedValue([
      {
        position: 2,
        studentId: 1,
        studentName: "Ana",
        totalActivities: 3,
        totalScore: 20,
        averageScore: 6.67,
        correctAnswers: 8,
        totalQuestions: 10,
        accuracyPercentage: 80,
      },
    ]);
  render(<CoordinatorRanking />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Ana")).toBeVisible();
  expect(screen.getByText("2º")).toBeVisible();
  expect(screen.getByText("80%")).toBeVisible();
  fireEvent.change(screen.getByRole("combobox", { name: "Ranking" }), {
    target: { value: "school" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Bimestre" }), {
    target: { value: "2" },
  });
  await waitFor(() =>
    expect(studentRankingApi.list).toHaveBeenLastCalledWith(
      { year: new Date().getFullYear(), bimester: 2, schoolId: 7 },
      expect.any(AbortSignal),
    ),
  );
});

test("métricas mostram os totais reais, inclusive zero", async () => {
  jest
    .mocked(metricsApi.school)
    .mockResolvedValue({
      schoolId: 7,
      schoolName: "Escola Sete",
      bigNumbers: {
        students: 12,
        teachers: 2,
        classrooms: 1,
        subjects: 4,
        activities: 0,
        submissions: 0,
      },
    });
  render(<CoordinatorMetrics />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Visão geral · Escola Sete")).toBeVisible();
  expect(screen.getAllByText("12")).toHaveLength(1);
  expect(screen.getAllByText("0")).toHaveLength(2);
  expect(screen.queryByText("Totais da escola")).not.toBeInTheDocument();
});

test("2FA só muda após confirmação com senha e sucesso do backend", async () => {
  jest
    .mocked(authApi.updateTwoFactor)
    .mockRejectedValueOnce(new Error("Senha atual incorreta."))
    .mockResolvedValueOnce(undefined);
  render(<TwoFactorSettings />, { wrapper: queryWrapper().wrapper });
  const toggle = screen.getByRole("switch");
  fireEvent.click(toggle);
  fireEvent.change(screen.getByLabelText("Senha atual"), {
    target: { value: "errada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
  expect(await screen.findByText("Senha atual incorreta.")).toBeVisible();
  expect(toggle).toHaveAttribute("aria-checked", "true");
  fireEvent.change(screen.getByLabelText("Senha atual"), {
    target: { value: "Correta123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
  await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
  expect(authApi.updateTwoFactor).toHaveBeenLastCalledWith(
    { enabled: false, currentPassword: "Correta123" },
    expect.anything(),
  );
  expect(useAuthState.getState().session?.twoFactorRequired).toBe(false);
});

test("sessão antiga não presume configuração de 2FA", () => {
  useAuthState.getState().setSession(session);
  render(<TwoFactorSettings />, { wrapper: queryWrapper().wrapper });
  expect(screen.getByRole("switch")).toBeDisabled();
});

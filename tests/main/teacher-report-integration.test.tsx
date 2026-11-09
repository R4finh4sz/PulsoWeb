import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Reports } from "@/components/screens/TeacherReports";
import { reportsApi, type TeacherReport } from "@/integrations/reports/api";
import { quizzesApi } from "@/integrations/quizzes/api";
import { useAuthState } from "@/integrations/auth/state";
import { queryWrapper, session } from "../helpers";

jest.mock("@/integrations/reports/api", () => ({
  reportsApi: { get: jest.fn() },
}));
jest.mock("@/integrations/quizzes/api", () => ({
  quizzesApi: { reports: jest.fn() },
}));
const summary = {
  averageGrade: 8.2,
  expectedSubmissions: 40,
  submittedCount: 30,
  completionPercentage: 75,
  studentsWithOverdue: 6,
  classroomCount: 1,
  activityCount: 2,
  recipientHistoryComplete: true,
};
const data: TeacherReport = {
  generatedAt: "2026-11-08T15:00:00Z",
  summary,
  classrooms: [
    {
      ...summary,
      classroomId: 2,
      classroomName: "3º ano",
      schoolId: 7,
      schoolName: "Escola Central",
      studentCount: 20,
    },
  ],
};

beforeEach(() => {
  useAuthState.getState().setSession(session);
  jest.mocked(reportsApi.get).mockReset().mockResolvedValue(data);
  jest.mocked(quizzesApi.reports).mockReset().mockResolvedValue([]);
});
afterEach(() => useAuthState.getState().setSession(null));

test("resumo e turmas usam indicadores do backend sem recalcular ou dividir notas", async () => {
  render(<Reports initialStatus="ALL" />, { wrapper: queryWrapper().wrapper });
  const summaryView = within(
    await screen.findByRole("region", { name: "Resumo do recorte" }),
  );
  expect(summaryView.getByText("8,2 / 10")).toBeVisible();
  expect(summaryView.getByText("75%")).toBeVisible();
  expect(summaryView.getByText("30 de 40 entregas previstas")).toBeVisible();
  expect(screen.getByText("20 alunos · 2 atividades")).toBeVisible();
  expect(quizzesApi.reports).not.toHaveBeenCalled();
});

test("filtros enviam IDs e traduzem encerradas para FINISHED", async () => {
  render(<Reports initialStatus="ALL" />, { wrapper: queryWrapper().wrapper });
  await screen.findByRole("region", { name: "Resumo do recorte" });
  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[0], { target: { value: "7" } });
  fireEvent.change(selects[1], { target: { value: "2" } });
  fireEvent.change(selects[2], { target: { value: "CLOSED" } });
  await waitFor(() =>
    expect(reportsApi.get).toHaveBeenCalledWith(
      { schoolId: 7, classroomId: 2, status: "FINISHED" },
      expect.any(AbortSignal),
    ),
  );
});

test("histórico incompleto preserva nulos e não anuncia ausência de pendências", async () => {
  const incomplete = {
    ...summary,
    expectedSubmissions: null,
    completionPercentage: null,
    studentsWithOverdue: null,
    recipientHistoryComplete: false,
  };
  jest.mocked(reportsApi.get).mockResolvedValue({
    ...data,
    summary: incomplete,
    classrooms: [{ ...data.classrooms[0], ...incomplete, studentCount: null }],
  });
  render(<Reports initialStatus="ALL" />, { wrapper: queryWrapper().wrapper });
  expect(
    await screen.findByText(
      /Algumas atividades não possuem histórico completo/,
    ),
  ).toBeVisible();
  expect(screen.getByText("30 de — entregas previstas")).toBeVisible();
  expect(screen.queryByText("Sem pendências")).not.toBeInTheDocument();
  expect(
    screen.getByText("Alunos não informados · 2 atividades"),
  ).toBeVisible();
});

test("relatório da turma envia classroomId e mantém resumo histórico sem fabricar alunos", async () => {
  render(<Reports classroomId={2} initialStatus="CLOSED" />, {
    wrapper: queryWrapper().wrapper,
  });
  expect(await screen.findByText("30 de 40 entregas previstas")).toBeVisible();
  expect(reportsApi.get).toHaveBeenCalledWith(
    { schoolId: undefined, classroomId: 2, status: "FINISHED" },
    expect.any(AbortSignal),
  );
  expect(
    await screen.findByText(
      /O resumo está disponível, mas não foi possível obter o detalhamento/,
    ),
  ).toBeVisible();
});

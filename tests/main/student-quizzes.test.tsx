import { fireEvent, render, screen } from "@testing-library/react";
import { StudentQuiz } from "@/components/screens/StudentQuizzes";
import { quizzesApi } from "@/integrations/quizzes/api";
import { ApiError } from "@/api/client";
import { queryWrapper } from "../helpers";
import type { ReactNode } from "react";

jest.mock("@/integrations/quizzes/api", () => ({ quizzesApi: { get: jest.fn(), result: jest.fn(), submit: jest.fn() } }));
jest.mock("@/components/screens/Integration/shared", () => ({
  actionClass: "button",
  ErrorMessage: ({ error }: { error: unknown }) => error ? <p role="alert">{String(error)}</p> : null,
  Protected: ({ children }: { children: (user: object) => ReactNode }) => children({ id: "4", role: "aluno" }),
  Workspace: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
const submission = { quizId: 1, studentId: 4, submittedAt: "2026-01-01T12:00:00Z", score: { correct: 1, total: 10, grade: 1, themes: [], review: [] } };
beforeEach(() => {
  jest.mocked(quizzesApi.get).mockResolvedValue({ id: 1, subjectId: 1, classroomId: 1, teacherId: 3, status: "OPEN", createdAt: "2026-01-01", closesAt: "2099-01-01T12:00:00Z", questions: Array.from({ length: 10 }, (_, i) => ({ question: `Pergunta ${i + 1}`, theme: "Tema", options: ["A", "B", "C", "D"] })) });
  jest.mocked(quizzesApi.result).mockRejectedValue(new ApiError(404, "Sem entrega"));
  jest.mocked(quizzesApi.submit).mockResolvedValue(submission);
});

test("aluno entrega respostas em branco e vê correção do servidor", async () => {
  render(<StudentQuiz id={1} />, { wrapper: queryWrapper().wrapper });
  const button = await screen.findByRole("button", { name: "Finalizar e ver correção" });
  fireEvent.click(screen.getAllByRole("radio")[0]);
  fireEvent.click(button);
  expect(await screen.findByText(/Nota: 1/)).toBeVisible();
  expect(quizzesApi.submit).toHaveBeenCalledWith(1, [0, ...Array(9).fill(null)]);
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
});

test("entrega existente abre resultado sem oferecer reenvio", async () => {
  jest.mocked(quizzesApi.result).mockResolvedValue(submission);
  render(<StudentQuiz id={1} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText(/Nota: 1/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Finalizar e ver correção" })).not.toBeInTheDocument();
  expect(quizzesApi.submit).not.toHaveBeenCalled();
});

test("prazo encerrado bloqueia preenchimento e envio", async () => {
  const quiz = await quizzesApi.get(1);
  jest.mocked(quizzesApi.get).mockResolvedValue({ ...quiz, closesAt: "2000-01-01T12:00:00Z" });
  render(<StudentQuiz id={1} />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("button", { name: "Finalizar e ver correção" })).toBeDisabled();
  expect(screen.getAllByRole("radio")[0]).toBeDisabled();
  expect(quizzesApi.submit).not.toHaveBeenCalled();
});

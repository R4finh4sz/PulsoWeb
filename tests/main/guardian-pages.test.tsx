import { GuardianCorrectionScreen } from "@/components/screens/Guardian/Correction";
import { GuardianDecisionScreen } from "@/components/screens/Guardian/Decision";
import { guardianApi } from "@/integrations/guardian/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { queryWrapper } from "../helpers";

jest.mock("@/integrations/guardian/api", () => ({
  ...jest.requireActual("@/integrations/guardian/api"),
  guardianApi: { invitation: jest.fn(), decide: jest.fn(), correctionView: jest.fn(), correct: jest.fn() },
}));

test("responsável confirma enviando parentesco, declaração e versão dos termos", async () => {
  jest.mocked(guardianApi.invitation).mockResolvedValue({
    studentName: "Ana", schoolName: "Escola X", purpose: "Cadastro", expiresAt: "2099-01-01T00:00:00Z",
    terms: { version: "2", title: "Termos", content: "Texto" }, privacy: { version: "1.0", title: "Privacidade", content: "Politica" }, relationships: ["MOTHER", "FATHER"],
  });
  jest.mocked(guardianApi.decide).mockResolvedValue({ decision: "CONFIRM", decidedAt: "2099-01-01T00:00:00Z" });
  render(<GuardianDecisionScreen token="t" />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(await screen.findByLabelText("Seu parentesco com o aluno"), { target: { value: "MOTHER" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  await waitFor(() =>
    expect(guardianApi.decide).toHaveBeenCalledWith("t", {
      decision: "CONFIRM", relationship: "MOTHER", declaration: true, termsVersion: "2", privacyAccepted: true, privacyVersion: "1.0",
    }),
  );
});

test("link vencido mostra mensagem de indisponível", async () => {
  jest.mocked(guardianApi.invitation).mockRejectedValue(new Error("indisponível"));
  render(<GuardianDecisionScreen token="t" />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("Este link expirou ou já foi usado.")).toBeVisible();
});

test("aluno corrige contato e é avisado da nova conferência", async () => {
  jest.mocked(guardianApi.correctionView).mockResolvedValue({
    studentName: "Ana", schoolName: "Escola X", reason: "E-mail errado", expiresAt: "2099-01-01T00:00:00Z",
  });
  jest.mocked(guardianApi.correct).mockResolvedValue({ status: "AWAITING_SCHOOL_CHECK" });
  render(<GuardianCorrectionScreen token="t" />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByText("E-mail errado")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Nome completo do responsável"), { target: { value: "Maria" } });
  fireEvent.change(screen.getByLabelText("E-mail do responsável"), { target: { value: "m@x.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar correção" }));
  expect(await screen.findByText(/voltou para a conferência da escola/)).toBeVisible();
  expect(guardianApi.correct).toHaveBeenCalledWith("t", { name: "Maria", email: "m@x.com" });
});

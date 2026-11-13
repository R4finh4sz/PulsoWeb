import { StudentSchoolTransfer } from "@/components/screens/ClassroomDetails/StudentSchoolTransfer";
import { registrationApi } from "@/integrations/registration/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { queryWrapper } from "../helpers";

jest.mock("@/integrations/registration/api", () => ({ registrationApi: { transferStudent: jest.fn() } }));
jest.mock("@/components/screens/Registration/InvitationSchoolSelector", () => ({
  InvitationSchoolSelector: ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
    <select aria-label="Escola de destino" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Selecione</option><option value="1">Atual</option><option value="2">Destino</option>
    </select>
  ),
}));
const student = { id: 7, fullName: "Ana Silva", ra: "123", email: "ana@example.com", role: "STUDENT" as const, schoolId: 1, classroomId: 5 };

test("solicita transferência com os dados do aluno e aguarda o aceite sem removê-lo", async () => {
  jest.mocked(registrationApi.transferStudent).mockResolvedValue({ id: 1, status: "PENDING" });
  render(<StudentSchoolTransfer student={student} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(screen.getByText("Transferir para outra escola"));
  expect(screen.getByRole("button", { name: "Solicitar transferência" })).toBeDisabled();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
  expect(screen.getByRole("alert")).toHaveTextContent("diferente da atual");
  expect(screen.getByRole("button", { name: "Solicitar transferência" })).toBeDisabled();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Solicitar transferência" }));
  await waitFor(() => expect(registrationApi.transferStudent).toHaveBeenCalledWith({ fullName: "Ana Silva", ra: "123", schoolId: 2 }));
  expect(await screen.findByRole("status")).toHaveTextContent("permanece nesta escola até o aceite");
});

test("mostra erro de transferência pendente e permite corrigir o destino", async () => {
  jest.mocked(registrationApi.transferStudent).mockRejectedValue(new Error("O aluno já possui uma transferência pendente."));
  render(<StudentSchoolTransfer student={student} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(screen.getByText("Transferir para outra escola"));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Solicitar transferência" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("transferência pendente");
});

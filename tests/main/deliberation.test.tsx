import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { Deliberation } from "@/components/screens/ClassroomDetails/Deliberation";
import { ClassroomForm } from "@/components/screens/Integration/Classrooms";
import { classroomsApi } from "@/integrations/classrooms/api";
import { queryWrapper } from "../helpers";

jest.mock("@/integrations/classrooms/api", () => ({ classroomsApi: { students: jest.fn(), list: jest.fn(), update: jest.fn(), deliberate: jest.fn().mockImplementation(async (body) => body) } }));
jest.mock("@/store/feedbackStore", () => ({ ...jest.requireActual("@/store/feedbackStore"), showRequestError: jest.fn() }));
const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
const room = { id: 1, name: "1º ano", identifier: "A", schoolId: 1, teacherIds: [] };
beforeEach(() => {
  jest.mocked(classroomsApi.students).mockResolvedValue([
    { id: 10, fullName: "Ana", role: "STUDENT", classroomId: 1, ra: "010", email: "ana@exemplo.com" },
    { id: 11, fullName: "Bruno", role: "STUDENT", classroomId: 1, ra: "011", email: "bruno@exemplo.com" },
  ]);
  jest.mocked(classroomsApi.list).mockResolvedValue([
    room,
    { ...room, id: 2, name: "2º ano" },
    { ...room, id: 3, schoolId: 2, name: "Outra escola" },
  ]);
});
test("falha no envio preserva a revisão para tentar novamente", async () => {
  jest.mocked(classroomsApi.deliberate).mockRejectedValueOnce(new Error("A turma foi alterada."));
  render(<Deliberation room={room} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("checkbox", { name: "Selecionar todos" }));
  fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
  fireEvent.click(screen.getByRole("radio", { name: "Finalizar a turma por formatura" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar aprovação" }));
  fireEvent.click(screen.getByRole("button", { name: "Revisar deliberação" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar deliberação" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar deliberação" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Confirmar deliberação?" })).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Enviar deliberação" })).toBeEnabled();
  expect(screen.queryByRole("dialog", { name: "Deliberação concluída" })).not.toBeInTheDocument();
});
test("nome e identificador são somente leitura sem ação de salvar", () => {
  render(<ClassroomForm existing={room} />, { wrapper: queryWrapper().wrapper });
  expect(screen.getByText(room.name)).toBeVisible();
  expect(screen.getByText(room.identifier)).toBeVisible();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Salvar turma" })).not.toBeInTheDocument();
});
test("monta payload completo com resultados e turmas de destino", async () => {
  render(<Deliberation room={room} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("checkbox", { name: /Ana/ }));
  fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
  expect(screen.getByRole("dialog", { name: "Aprovar alunos" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Confirmar aprovação" })).toBeDisabled();
  expect(screen.getByRole("radio", { name: "Finalizar a turma por formatura" })).toBeDisabled();
  const approved = screen.getByLabelText("Turma de destino");
  expect(within(approved).queryByRole("option", { name: /Outra escola/ })).not.toBeInTheDocument();
  expect(within(approved).queryByRole("option", { name: /1º ano/ })).not.toBeInTheDocument();
  fireEvent.change(approved, { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar aprovação" }));
  expect(screen.queryByRole("button", { name: "Definir destino da deliberação" })).not.toBeInTheDocument();
  expect(screen.queryByText(/aprovados ·/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: /Bruno/ }));
  fireEvent.click(screen.getByRole("button", { name: "Reprovar" }));
  fireEvent.change(screen.getByLabelText("Turma de destino"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar reprovação" }));
  fireEvent.click(screen.getByRole("button", { name: "Revisar deliberação" }));
  const preview = screen.getByRole("region", { name: "Revisão da deliberação" });
  expect(preview).toHaveTextContent("Ana");
  expect(preview).toHaveTextContent("Bruno");
  const expected = { classroomId: 1, action: "TRANSFER", students: [
    { studentId: 10, result: "APPROVED", destinationClassroomId: 2 },
    { studentId: 11, result: "FAILED", destinationClassroomId: 2 },
  ] };
  fireEvent.click(screen.getByRole("button", { name: "Enviar deliberação" }));
  expect(classroomsApi.deliberate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar deliberação" }));
  expect(await screen.findByRole("dialog", { name: "Deliberação concluída" })).toBeVisible();
  expect(jest.mocked(classroomsApi.deliberate).mock.calls[0][0]).toEqual(expected);
  fireEvent.click(screen.getByRole("button", { name: "Voltar ao painel" }));
  expect(replace).toHaveBeenCalledWith("/coordinator");
});
test("formatura exige todos aprovados e não vincula uma nova turma", async () => {
  render(<Deliberation room={room} />, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole("checkbox", { name: /Ana/ }));
  fireEvent.click(screen.getByRole("button", { name: "Reprovar" }));
  expect(screen.queryByRole("radio", { name: "Finalizar a turma por formatura" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar todos" }));
  fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
  fireEvent.click(screen.getByRole("radio", { name: "Finalizar a turma por formatura" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar aprovação" }));
  fireEvent.click(screen.getByRole("button", { name: "Revisar deliberação" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar deliberação" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar deliberação" }));
  await screen.findByRole("dialog", { name: "Deliberação concluída" });
  const payload = jest.mocked(classroomsApi.deliberate).mock.calls[0][0];
  expect(payload.action).toBe("GRADUATE");
  expect(payload.students).toHaveLength(2);
  expect(payload.students.every((student: { destinationClassroomId: number | null }) => student.destinationClassroomId === null)).toBe(true);
});

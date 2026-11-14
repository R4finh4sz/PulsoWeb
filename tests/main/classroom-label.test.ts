import { classroomLabel } from "@/utils/classroomLabel";

test.each([
  [{ name: "1º ano · Manhã", identifier: "A" }, "1º ano · Manhã · A"],
  [{ name: "1º ano · Manhã", identifier: "B" }, "1º ano · Manhã · B"],
  [{ name: "1º ano A", identifier: "A" }, "1º ano A"],
  [{ name: "1º ano · Manhã · A", identifier: "A" }, "1º ano · Manhã · A"],
  [{ name: "1º ano A" }, "1º ano A"],
  [{ name: "1º ano", identifier: "" }, "1º ano"],
  [undefined, ""],
])("identifica a turma sem duplicar o identificador: %s", (room, label) => {
  expect(classroomLabel(room)).toBe(label);
});

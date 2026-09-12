import type { SessionUser } from "../interfaces/auth";
import type { Classroom } from "../interfaces/classroom";
import { mockUsers, schools } from "../mocks/platform";
import { ClassroomSchema, type ClassroomForm } from "../validation/Classroom.validation";

export function createClassroom(user: SessionUser, input: ClassroomForm, existing: Classroom[]): Classroom {
  const data = ClassroomSchema.parse(input);
  if (user.role !== "coordenador" || !schools.some((school) => school.id === data.schoolId && school.coordinatorId === user.id)) {
    throw new Error("Você só pode criar turmas na escola sob sua coordenação.");
  }
  if (!data.teacherIds.every((id) => mockUsers.some((person) => person.id === id && person.role === "professor"))) {
    throw new Error("Selecione um professor válido.");
  }
  const name = `${data.year}º ano ${data.identifier}`;
  if (existing.some((room) => room.schoolId === data.schoolId && room.name === name)) {
    throw new Error("Já existe uma turma com esse ano e identificador nesta escola.");
  }
  return { id: crypto.randomUUID(), schoolId: data.schoolId, name, period: data.period, students: 0, teacherIds: data.teacherIds, color: "blue" };
}


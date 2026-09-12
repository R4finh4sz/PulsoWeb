import type { School } from "../interfaces/school";
import type { SessionUser } from "../interfaces/auth";
import type { Classroom } from "../interfaces/classroom";
import { mockUsers, schools } from "../mocks/platform";
import { ClassroomSchema, type ClassroomForm } from "../validation/Classroom.validation";

export function removeClassroomTeacher(user: SessionUser, roomId: string, teacherId: string, rooms: Classroom[], availableSchools: School[] = schools): Classroom[] {
  const room = rooms.find((item) => item.id === roomId);
  if (!room || user.role !== "coordenador" || !availableSchools.some((school) => school.id === room.schoolId && school.coordinatorId === user.id)) {
    throw new Error("Você só pode remover vínculos das turmas sob sua coordenação.");
  }
  return rooms.map((item) => item.id === roomId ? { ...item, teacherIds: item.teacherIds.filter((id) => id !== teacherId) } : item);
}

export function addClassroomTeachers(user: SessionUser, roomId: string, teacherIds: string[], rooms: Classroom[], availableSchools: School[] = schools, availableTeachers: SessionUser[] = mockUsers): Classroom[] {
  const room = rooms.find((item) => item.id === roomId);
  if (!room || user.role !== "coordenador" || !availableSchools.some((school) => school.id === room.schoolId && school.coordinatorId === user.id)) {
    throw new Error("Você só pode vincular professores às turmas sob sua coordenação.");
  }
  const ids = ClassroomSchema.shape.teacherIds.parse(teacherIds);
  if (!ids.every((id) => availableTeachers.some((person) => person.id === id && person.role === "professor"))) {
    throw new Error("Selecione professores válidos.");
  }
  return rooms.map((item) => item.id === roomId ? { ...item, teacherIds: [...new Set([...item.teacherIds, ...ids])] } : item);
}

export function createClassroom(user: SessionUser, input: ClassroomForm, existing: Classroom[], availableSchools: School[] = schools, availableTeachers: SessionUser[] = mockUsers): Classroom {
  const data = ClassroomSchema.parse(input);
  if (user.role !== "coordenador" || !availableSchools.some((school) => school.id === data.schoolId && school.coordinatorId === user.id)) {
    throw new Error("Você só pode criar turmas na escola sob sua coordenação.");
  }
  if (!data.teacherIds.every((id) => availableTeachers.some((person) => person.id === id && person.role === "professor"))) {
    throw new Error("Selecione um professor válido.");
  }
  const name = `${data.year}º ano ${data.identifier}`;
  if (existing.some((room) => room.schoolId === data.schoolId && room.name === name)) {
    throw new Error("Já existe uma turma com esse ano e identificador nesta escola.");
  }
  return { id: crypto.randomUUID(), schoolId: data.schoolId, name, period: data.period, students: 0, teacherIds: data.teacherIds, color: "blue" };
}

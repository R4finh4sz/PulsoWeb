import type { SessionUser } from "../interfaces/auth";
import type { Teacher } from "../interfaces/teacher";
import { TeacherSchema, type TeacherForm } from "../validation/Teacher.validation";

export function createTeacher(user: SessionUser, input: TeacherForm, teachers: Teacher[]): Teacher {
  if (user.role !== "coordenador") throw new Error("Somente o coordenador pode criar professores.");
  const data = TeacherSchema.parse(input);
  if (teachers.some((person) => person.registration.toUpperCase() === data.registration)) {
    throw new Error("Já existe um professor com esta matrícula.");
  }
  if (teachers.some((person) => person.email.toLowerCase() === data.email)) {
    throw new Error("Já existe um professor com este email.");
  }
  return { ...data, id: crypto.randomUUID(), role: "professor" };
}

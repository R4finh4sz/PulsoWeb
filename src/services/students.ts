import type { SessionUser } from "../interfaces/auth";
import type { Classroom } from "../interfaces/classroom";
import type { School } from "../interfaces/school";
import type { Student } from "../interfaces/student";
import { StudentSchema, type StudentForm } from "../validation/Student.validation";

export function createStudent(user: SessionUser, input: StudentForm, existing: Student[], rooms: Classroom[], schools: School[]): Student {
  const data = StudentSchema.parse(input);
  const room = rooms.find((item) => item.id === data.classroomId);
  if (user.role !== "coordenador" || !room || !schools.some((school) => school.id === room.schoolId && school.coordinatorId === user.id)) {
    throw new Error("Selecione uma turma sob sua coordenação.");
  }
  const schoolRoomIds = new Set(rooms.filter((item) => item.schoolId === room.schoolId).map((item) => item.id));
  const students = existing.filter((student) => schoolRoomIds.has(student.classroomId));
  if (students.some((student) => student.enrollment.toLowerCase() === data.enrollment.toLowerCase())) throw new Error("Já existe um aluno com essa matrícula nesta escola.");
  if (students.some((student) => student.email.toLowerCase() === data.email)) throw new Error("Já existe um aluno com esse email nesta escola.");
  return { id: crypto.randomUUID(), ...data };
}

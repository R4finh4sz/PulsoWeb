import type { SessionUser } from "../interfaces/auth";

export const mockPassword = "Pulso123";

export const mockUsers: SessionUser[] = [
  { id: "admin-1", name: "Rafael Souza", email: "admin@pulso.com", role: "admin" },
  { id: "coordinator-1", name: "Mariana Costa", email: "coordenador@pulso.com", role: "coordenador" },
  { id: "teacher-1", name: "Lucas Oliveira", email: "professor@pulso.com", role: "professor" },
  { id: "teacher-2", name: "Ana Martins", email: "ana@pulso.com", role: "professor" },
];

export const schools = [
  { id: "school-1", name: "Escola Horizonte", city: "São Paulo, SP", coordinatorId: "coordinator-1", initials: "EH" },
  { id: "school-2", name: "Escola Caminhos", city: "Campinas, SP", coordinatorId: null, initials: "EC" },
];

export const classrooms = [
  { id: "class-1", schoolId: "school-1", name: "3º ano B", period: "Manhã", students: 28, teacherIds: ["teacher-1"], color: "blue" },
  { id: "class-2", schoolId: "school-1", name: "1º ano A", period: "Tarde", students: 25, teacherIds: ["teacher-1"], color: "yellow" },
  { id: "class-3", schoolId: "school-1", name: "2º ano A", period: "Manhã", students: 30, teacherIds: [], color: "blue" },
];

export const subjects = [
  { id: "subject-1", classroomId: "class-1", teacherId: "teacher-1", name: "Matemática", topic: "Multiplicação no dia a dia", topics: 4, questions: 18, quizzes: 2 },
  { id: "subject-2", classroomId: "class-2", teacherId: "teacher-1", name: "Matemática", topic: "Frações e suas representações", topics: 3, questions: 12, quizzes: 1 },
];


import type { SessionUser } from "../interfaces/auth";
import { classrooms, schools, subjects } from "../mocks/platform";

export function getSchoolsForUser(user: SessionUser) {
  if (user.role === "admin") return schools;
  if (user.role === "coordenador") return schools.filter((school) => school.coordinatorId === user.id);
  const schoolIds = new Set(classrooms.filter((room) => room.teacherIds.includes(user.id)).map((room) => room.schoolId));
  return schools.filter((school) => schoolIds.has(school.id));
}

export function getClassroomsForUser(user: SessionUser) {
  if (user.role === "admin") return classrooms;
  if (user.role === "professor") return classrooms.filter((room) => room.teacherIds.includes(user.id));
  const schoolIds = new Set(getSchoolsForUser(user).map((school) => school.id));
  return classrooms.filter((room) => schoolIds.has(room.schoolId));
}

export function getSubjectsForUser(user: SessionUser) {
  const classroomIds = new Set(getClassroomsForUser(user).map((room) => room.id));
  return subjects.filter((subject) => classroomIds.has(subject.classroomId) && (user.role !== "professor" || subject.teacherId === user.id));
}


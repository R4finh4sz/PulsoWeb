import type { Classroom } from "../interfaces/classroom";
import type { SessionUser } from "../interfaces/auth";
import { classrooms, schools, subjects } from "../mocks/platform";

export function getSchoolsForUser(user: SessionUser, rooms: Classroom[] = classrooms) {
  if (user.role === "admin") return schools;
  if (user.role === "coordenador") return schools.filter((school) => school.coordinatorId === user.id);
  const schoolIds = new Set(rooms.filter((room) => room.teacherIds.includes(user.id)).map((room) => room.schoolId));
  return schools.filter((school) => schoolIds.has(school.id));
}

export function getClassroomsForUser(user: SessionUser, rooms: Classroom[] = classrooms) {
  if (user.role === "admin") return rooms;
  if (user.role === "professor") return rooms.filter((room) => room.teacherIds.includes(user.id));
  const schoolIds = new Set(getSchoolsForUser(user, rooms).map((school) => school.id));
  return rooms.filter((room) => schoolIds.has(room.schoolId));
}

export function getSubjectsForUser(user: SessionUser, rooms: Classroom[] = classrooms) {
  const classroomIds = new Set(getClassroomsForUser(user, rooms).map((room) => room.id));
  return subjects.filter((subject) => classroomIds.has(subject.classroomId) && (user.role !== "professor" || subject.teacherId === user.id));
}


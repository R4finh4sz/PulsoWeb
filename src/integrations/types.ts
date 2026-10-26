export type Role = "ADMIN" | "PEDAGOGICAL_COORDINATOR" | "TEACHER" | "STUDENT";
export type User = {
  id: number;
  fullName: string;
  ra: string;
  matricula?: string | null;
  email: string;
  role: Role;
  classroomId: number | null;
  schoolIds?: number[];
  activeSchoolId?: number | null;
  schoolId?: number | null;
};
export type CreateUser = Pick<User, "fullName" | "ra" | "email"> & {
  schoolId?: number;
};
export type UserPage = {
  content: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
export type UserFilters = {
  schoolId?: number;
  q?: string;
  page?: number;
  size?: number;
  classroomId?: number;
  unassigned?: boolean;
};
export type UserResource = "students" | "teachers" | "coordinators";
export type Classroom = {
  schoolName?: string | null;
  id: number;
  name: string;
  identifier: string;
  teacherIds: number[];
  schoolId?: number;
};
export type CreateClassroom = Pick<Classroom, "name" | "identifier">;
export type Subject = {
  syllabus?: string;
  topics?: import("@/validation/Subject.validation").SubjectTopic[];
  teacherIds?: number[];
  id: number;
  name: string;
  classroomId: number;
  teacherId: number;
};

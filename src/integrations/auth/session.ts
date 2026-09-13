import type { User } from "../types";
import type { SessionUser, UserRole } from "@/interfaces/auth";
const roles: Record<User["role"], UserRole> = { ADMIN: "admin", PEDAGOGICAL_COORDINATOR: "coordenador", TEACHER: "professor", STUDENT: "aluno" };
export function toSessionUser(user: User): SessionUser {
  return { id: String(user.id), name: user.fullName, email: user.email, role: roles[user.role] };
}

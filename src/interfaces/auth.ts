export type UserRole = "admin" | "coordenador" | "professor" | "aluno";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  coordenador: "Coordenador",
  professor: "Professor",
  aluno: "Aluno",
};

export const homeRoutes: Record<UserRole, string> = {
  admin: "/admin",
  coordenador: "/coordenador",
  professor: "/professor",
  aluno: "/aluno",
};


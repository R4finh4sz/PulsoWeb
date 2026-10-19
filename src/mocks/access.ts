import type { LoginResponse } from "@/integrations/auth/state";
import type { User } from "@/integrations/types";

export const mockAccessEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.NODE_ENV !== "test" &&
  process.env.NEXT_PUBLIC_MOCK_ACCESS !== "false";

export const demoUsers: User[] = [
  {
    id: 1,
    fullName: "Admin Demonstração",
    email: "admin@pulso.com",
    ra: "001",
    role: "ADMIN",
    classroomId: null,
    schoolId: null,
  },
  {
    id: 2,
    fullName: "Carla Coordenadora",
    email: "coordenador@pulso.com",
    ra: "002",
    role: "PEDAGOGICAL_COORDINATOR",
    classroomId: null,
    schoolId: 1,
  },
  {
    id: 3,
    fullName: "Paulo Professor",
    email: "professor@pulso.com",
    ra: "003",
    role: "TEACHER",
    classroomId: null,
    schoolId: 1,
  },
  {
    id: 4,
    fullName: "Ana Aluna",
    email: "aluno@pulso.com",
    ra: "004",
    role: "STUDENT",
    classroomId: 1,
    schoolId: 1,
  },
  {
    id: 5,
    fullName: "Mariana Souza",
    email: "mariana@pulso.com",
    ra: "005",
    role: "TEACHER",
    classroomId: null,
    schoolId: 1,
  },
];

export function createDemoSession(user: User): LoginResponse {
  return {
    accessToken: `pulso-mock:${user.id}`,
    tokenType: "Bearer",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    twoFactorRequired: false,
    codeExpiresAt: "",
    resendAvailableAt: "",
    user: {
      role: user.role,
      classroomId: user.classroomId,
      schoolId: user.schoolId ?? null,
      firstLogin: false,
      termsAccepted: true,
      termsAcceptedVersions: ["demo-1"],
    },
  };
}

export function getDemoUser(token?: string) {
  return demoUsers.find((user) => token === `pulso-mock:${user.id}`);
}

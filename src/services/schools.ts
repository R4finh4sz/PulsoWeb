import type { SessionUser } from "../interfaces/auth";
import type { School } from "../interfaces/school";
import { mockUsers } from "../mocks/platform";
import { SchoolSchema, type SchoolForm } from "../validation/School.validation";

export function createSchool(
  user: SessionUser,
  input: SchoolForm,
  schools: School[],
  coordinators: { id: string; role: string }[] = mockUsers,
): School {
  if (user.role !== "admin")
    throw new Error("Somente o administrador pode criar escolas.");
  const data = SchoolSchema.parse(input);
  void coordinators;
  void schools;
  return {
    ...data,
    coordinatorId: null,
    id: crypto.randomUUID(),

    initials: data.name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),
  };
}

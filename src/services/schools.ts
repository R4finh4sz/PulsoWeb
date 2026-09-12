import type { SessionUser } from "../interfaces/auth";
import { mockUsers } from "../mocks/platform";
import type { School } from "../interfaces/school";
import { normalizeCnpj, SchoolSchema, type SchoolForm } from "../validation/School.validation";

export function createSchool(user: SessionUser, input: SchoolForm, schools: School[], coordinators: { id: string; role: string }[] = mockUsers): School {
  if (user.role !== "admin") throw new Error("Somente o administrador pode criar escolas.");
  const data = SchoolSchema.parse(input);
  if (!coordinators.some((person) => person.id === data.coordinatorId && person.role === "coordenador")) throw new Error("Selecione um coordenador válido.");
  if (schools.some((school) => school.cnpj && normalizeCnpj(school.cnpj) === data.cnpj)) {
    throw new Error("Já existe uma escola cadastrada com este CNPJ.");
  }
  return {
    ...data,
    id: crypto.randomUUID(),

    initials: data.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(),
  };
}


import type { SessionUser } from "../interfaces/auth";
import type { Coordinator } from "../interfaces/coordinator";
import { CoordinatorSchema, type CoordinatorForm } from "../validation/Coordinator.validation";

export function createCoordinator(user: SessionUser, input: CoordinatorForm, coordinators: Coordinator[]): Coordinator {
  if (user.role !== "admin") throw new Error("Somente o administrador pode criar coordenadores.");
  const data = CoordinatorSchema.parse(input);
  if (coordinators.some((person) => person.registration.toUpperCase() === data.registration)) {
    throw new Error("Já existe um coordenador com esta matrícula.");
  }
  return { ...data, id: crypto.randomUUID(), role: "coordenador" };
}


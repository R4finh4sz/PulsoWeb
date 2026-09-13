"use client";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/integrations/auth/hooks";
import { usersApi } from "@/integrations/users/api";
import { useCoordinatorStore } from "@/store/coordinatorStore";
import type { Coordinator } from "@/interfaces/coordinator";
export function useSchoolCoordinators() {
  const session = useMe();
  const local = useCoordinatorStore(state => state.coordinators);
  const query = useQuery({
    queryKey: ["users", "coordinators", "school-options"],
    enabled: session.data?.role === "ADMIN",
    queryFn: async ({ signal }) => {
      const result: Coordinator[] = [];
      let page = 0;
      let totalPages = 1;
      while (page < totalPages) {
        const response = await usersApi.list("coordinators", { page, size: 100 }, signal);
        result.push(...response.content.map(person => ({
          id: String(person.id), name: person.fullName, email: person.email,
          registration: person.ra, birthDate: "", role: "coordenador" as const,
        })));
        totalPages = response.totalPages; page++;
      }
      return result;
    },
  });
  const merged = new Map(local.map(person => [person.id, person]));
  for (const person of query.data ?? []) merged.set(person.id, person);
  return { coordinators: [...merged.values()], error: query.error };
}

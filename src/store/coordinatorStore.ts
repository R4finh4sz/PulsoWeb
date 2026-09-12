"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SessionUser } from "@/interfaces/auth";
import type { Coordinator } from "@/interfaces/coordinator";
import type { CoordinatorForm } from "@/validation/Coordinator.validation";
import { mockUsers } from "@/mocks/platform";
import { createCoordinator } from "@/services/coordinators";

type CoordinatorState = {
  coordinators: Coordinator[];
  addCoordinator: (user: SessionUser, form: CoordinatorForm) => void;
};

export const useCoordinatorStore = create<CoordinatorState>()(
  persist(
    (set) => ({
      coordinators: mockUsers.filter((person) => person.role === "coordenador").map((person) => ({ ...person, role: "coordenador", birthDate: "", registration: "" })),
      addCoordinator: (user, form) => set((state) => ({
        coordinators: [...state.coordinators, createCoordinator(user, form, state.coordinators)],
      })),
    }),
    {
      name: "pulso-demo-coordinators",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ coordinators: state.coordinators }),
    },
  ),
);


"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { School } from "@/interfaces/school";
import type { SessionUser } from "@/interfaces/auth";
import type { SchoolForm } from "@/validation/School.validation";
import { schools } from "@/mocks/platform";
import { createSchool } from "@/services/schools";

type SchoolState = {
  schools: School[];
  addSchool: (user: SessionUser, form: SchoolForm) => void;
};

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set) => ({
      schools,
      addSchool: (user, form) => set((state) => ({ schools: [...state.schools, createSchool(user, form, state.schools)] })),
    }),
    {
      name: "pulso-demo-schools",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ schools: state.schools }),
    },
  ),
);


"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SessionUser } from "@/interfaces/auth";
import type { Teacher } from "@/interfaces/teacher";
import type { TeacherForm } from "@/validation/Teacher.validation";
import { mockUsers } from "@/mocks/platform";
import { createTeacher } from "@/services/teachers";

type TeacherState = {
  teachers: Teacher[];
  addTeacher: (user: SessionUser, form: TeacherForm) => void;
};

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set) => ({
      teachers: mockUsers.filter((person) => person.role === "professor").map((person) => ({ ...person, role: "professor", registration: "" })),
      addTeacher: (user, form) => set((state) => ({
        teachers: [...state.teachers, createTeacher(user, form, state.teachers)],
      })),
    }),
    {
      name: "pulso-demo-teachers",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ teachers: state.teachers }),
    },
  ),
);


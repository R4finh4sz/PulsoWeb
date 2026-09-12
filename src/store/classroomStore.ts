"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Classroom } from "@/interfaces/classroom";
import type { SessionUser } from "@/interfaces/auth";
import type { ClassroomForm } from "@/validation/Classroom.validation";
import { classrooms } from "@/mocks/platform";
import { createClassroom } from "@/services/classrooms";

type ClassroomState = {
  rooms: Classroom[];
  addClassroom: (user: SessionUser, form: ClassroomForm) => void;
};

export const useClassroomStore = create<ClassroomState>()(
  persist(
    (set) => ({
      rooms: classrooms,
      addClassroom: (user, form) => set((state) => ({
        rooms: [...state.rooms, createClassroom(user, form, state.rooms)],
      })),
    }),
    {
      name: "pulso-demo-classrooms",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ rooms: state.rooms }),
    },
  ),
);


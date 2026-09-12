"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Classroom } from "@/interfaces/classroom";
import type { SessionUser } from "@/interfaces/auth";
import type { ClassroomForm } from "@/validation/Classroom.validation";
import { useSchoolStore } from "@/store/schoolStore";
import { classrooms } from "@/mocks/platform";
import { addClassroomTeachers, createClassroom, removeClassroomTeacher } from "@/services/classrooms";

type ClassroomState = {
  rooms: Classroom[];
  removeTeacher: (user: SessionUser, roomId: string, teacherId: string) => void;
  addClassroom: (user: SessionUser, form: ClassroomForm) => void;
  addTeachers: (user: SessionUser, roomId: string, teacherIds: string[]) => void;
};

export const useClassroomStore = create<ClassroomState>()(
  persist(
    (set) => ({
      rooms: classrooms,
      removeTeacher: (user, roomId, teacherId) => set((state) => ({
        rooms: removeClassroomTeacher(user, roomId, teacherId, state.rooms, useSchoolStore.getState().schools),
      })),
      addTeachers: (user, roomId, teacherIds) => set((state) => ({
        rooms: addClassroomTeachers(user, roomId, teacherIds, state.rooms, useSchoolStore.getState().schools),
      })),
      addClassroom: (user, form) => set((state) => ({
        rooms: [...state.rooms, createClassroom(user, form, state.rooms, useSchoolStore.getState().schools)],
      })),
    }),
    {
      name: "pulso-demo-classrooms",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ rooms: state.rooms }),
    },
  ),
);

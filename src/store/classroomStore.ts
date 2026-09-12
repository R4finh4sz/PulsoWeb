"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Classroom } from "@/interfaces/classroom";
import type { Student } from "@/interfaces/student";
import type { StudentForm } from "@/validation/Student.validation";
import { createStudent } from "@/services/students";
import type { SessionUser } from "@/interfaces/auth";
import type { ClassroomForm } from "@/validation/Classroom.validation";
import { useSchoolStore } from "@/store/schoolStore";
import { useTeacherStore } from "@/store/teacherStore";
import { classrooms } from "@/mocks/platform";
import { addClassroomTeachers, createClassroom, removeClassroomTeacher } from "@/services/classrooms";

type ClassroomState = {
  rooms: Classroom[];
  students: Student[];
  addStudent: (user: SessionUser, form: StudentForm) => void;
  removeTeacher: (user: SessionUser, roomId: string, teacherId: string) => void;
  addClassroom: (user: SessionUser, form: ClassroomForm) => void;
  addTeachers: (user: SessionUser, roomId: string, teacherIds: string[]) => void;
};

export const useClassroomStore = create<ClassroomState>()(
  persist(
    (set) => ({
      rooms: classrooms,
      students: [],
      addStudent: (user, form) => set((state) => {
        const student = createStudent(user, form, state.students, state.rooms, useSchoolStore.getState().schools);
        return {
          students: [...state.students, student],
          rooms: state.rooms.map((room) => room.id === student.classroomId ? { ...room, students: room.students + 1 } : room),
        };
      }),
      removeTeacher: (user, roomId, teacherId) => set((state) => ({
        rooms: removeClassroomTeacher(user, roomId, teacherId, state.rooms, useSchoolStore.getState().schools),
      })),
      addTeachers: (user, roomId, teacherIds) => set((state) => ({
        rooms: addClassroomTeachers(user, roomId, teacherIds, state.rooms, useSchoolStore.getState().schools, useTeacherStore.getState().teachers),
      })),
      addClassroom: (user, form) => set((state) => ({
        rooms: [...state.rooms, createClassroom(user, form, state.rooms, useSchoolStore.getState().schools, useTeacherStore.getState().teachers)],
      })),
    }),
    {
      name: "pulso-demo-classrooms",
      version: 1,
      migrate: (persisted) => {
        const previous = persisted as Pick<ClassroomState, "rooms">;
        return {
          rooms: previous.rooms.map((room) => ({
            ...room,
            name: room.name.replace(/^4º ano /, "1º ano ").replace(/^5º ano /, "2º ano "),
          })),
        };
      },
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ rooms: state.rooms, students: state.students }),
    },
  ),
);

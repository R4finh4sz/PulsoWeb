"use client";
import { useQuery } from "@tanstack/react-query";
import { classroomsApi } from "./api";
export function useClassrooms(enabled = true, allSchools = false) {
  return useQuery({
    queryKey: allSchools ? ["classrooms", "all-schools"] : ["classrooms"],
    queryFn: ({ signal }) =>
      allSchools
        ? classroomsApi.teacherList(signal)
        : classroomsApi.list(signal),
    enabled,
  });
}
export function useClassroom(id: number) {
  return useQuery({
    queryKey: ["classrooms", id],
    queryFn: ({ signal }) => classroomsApi.get(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
  });
}

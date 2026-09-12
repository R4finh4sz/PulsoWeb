"use client";

import { useRef, useState, type FormEvent } from "react";
import { useSchoolStore } from "@/store/schoolStore";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/interfaces/auth";
import { StudentSchema, type StudentForm } from "@/validation/Student.validation";
import { useClassroomStore } from "@/store/classroomStore";
import { getClassroomsForUser } from "@/services/dashboard";

export function useCreateStudent(user: SessionUser) {
  const router = useRouter();
  const availableSchools = useSchoolStore((state) => state.schools);
  const allRooms = useClassroomStore((state) => state.rooms);
  const rooms = getClassroomsForUser(user, allRooms, availableSchools);
  const [values, setValues] = useState<StudentForm>({ name: "", email: "", enrollment: "", classroomId: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentForm, string>>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);
  const addStudent = useClassroomStore((state) => state.addStudent);

  function setField<K extends keyof StudentForm>(field: K, value: StudentForm[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    const parsed = StudentSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof StudentForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof StudentForm;
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    setError("");
    submitted.current = true;
    setSaving(true);
    try {
      addStudent(user, parsed.data);
      router.push("/coordenador#students");
    } catch (cause) {
      submitted.current = false;
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o aluno.");
    }
  }

  return { values, errors, error, saving, rooms, setField, handleSubmit };
}

"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/interfaces/auth";
import { ClassroomSchema, type ClassroomForm } from "@/validation/Classroom.validation";
import { useClassroomStore } from "@/store/classroomStore";
import { getSchoolsForUser } from "@/services/dashboard";

export function useCreateClassroom(user: SessionUser) {
  const router = useRouter();
  const schools = getSchoolsForUser(user);
  const [values, setValues] = useState<ClassroomForm>({ year: "", identifier: "", schoolId: schools[0]?.id ?? "", teacherIds: [], period: "Manhã" });
  const [errors, setErrors] = useState<Partial<Record<keyof ClassroomForm, string>>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);
  const addClassroom = useClassroomStore((state) => state.addClassroom);

  function setField<K extends keyof ClassroomForm>(field: K, value: ClassroomForm[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    const parsed = ClassroomSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ClassroomForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ClassroomForm;
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
      addClassroom(user, parsed.data);
      router.push("/coordenador/turmas");
    } catch (cause) {
      submitted.current = false;
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "Não foi possível criar a turma.");
    }
  }

  return { values, errors, error, saving, schools, setField, handleSubmit };
}

"use client";

import { useRef, useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/interfaces/auth";
import { TeacherSchema, type TeacherForm } from "@/validation/Teacher.validation";
import { useTeacherStore } from "@/store/teacherStore";

export function useCreateTeacher(user: SessionUser) {
  const router = useRouter();
  const [values, setValues] = useState<TeacherForm>({ name: "", email: "", registration: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof TeacherForm, string>>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);
  const addTeacher = useTeacherStore((state) => state.addTeacher);

  function setField(field: keyof TeacherForm, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setError("");
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    const parsed = TeacherSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof TeacherForm, string>> = {};
      for (const issue of parsed.error.issues) nextErrors[issue.path[0] as keyof TeacherForm] ??= issue.message;
      setErrors(nextErrors);
      event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    submitted.current = true;
    setSaving(true);
    try {
      addTeacher(user, parsed.data);
      router.push("/coordenador/professores");
    } catch (cause) {
      submitted.current = false;
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o professor.");
    }
  }
  return { values, errors, error, saving, setField, handleSubmit };
}


"use client";

import { useRef, useState, type SyntheticEvent } from "react";
import { useSchoolStore } from "@/store/schoolStore";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/interfaces/auth";
import { ClassroomSchema, type ClassroomForm } from "@/validation/Classroom.validation";
import { getSchoolsForUser } from "@/services/dashboard";
import { classroomsApi } from "@/integrations/classrooms/api";
import { useApiMutation } from "@/integrations/useApiMutation";

export function useCreateClassroom(user: SessionUser) {
  const router = useRouter();
  const availableSchools = useSchoolStore((state) => state.schools);
  const schools = getSchoolsForUser(user, undefined, availableSchools);
  const [values, setValues] = useState<ClassroomForm>({ year: "", identifier: "", schoolId: schools[0]?.id ?? "", teacherIds: [], period: "Manhã" });
  const [errors, setErrors] = useState<Partial<Record<keyof ClassroomForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);
  const mutation = useApiMutation(async (input: ClassroomForm) => {
    const room = await classroomsApi.create({ name: `${input.year}º ano · ${input.period}`, identifier: input.identifier });
    for (const teacherId of input.teacherIds) await classroomsApi.assign(room.id, Number(teacherId));
    return room;
  });

  function setField<K extends keyof ClassroomForm>(field: K, value: ClassroomForm[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
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
    submitted.current = true;
    setSaving(true);
    try {
      await mutation.mutateAsync(parsed.data);
      router.push("/coordenador/turmas");
    } catch {
      submitted.current = false;
      setSaving(false);
    }
  }

  return { values, errors, saving, schools, setField, handleSubmit };
}

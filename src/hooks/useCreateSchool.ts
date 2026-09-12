"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/interfaces/auth";
import { SchoolSchema, type SchoolForm } from "@/validation/School.validation";
import { useSchoolStore } from "@/store/schoolStore";

export function useCreateSchool(user: SessionUser) {
  const router = useRouter();
  const [values, setValues] = useState<SchoolForm>({ name: "", cnpj: "", street: "", state: "", city: "", coordinatorId: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolForm, string>>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);
  const addSchool = useSchoolStore((state) => state.addSchool);

  function setField(field: keyof SchoolForm, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    const parsed = SchoolSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof SchoolForm, string>> = {};
      for (const issue of parsed.error.issues) nextErrors[issue.path[0] as keyof SchoolForm] ??= issue.message;
      setErrors(nextErrors);
      event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    submitted.current = true;
    setSaving(true);
    try {
      addSchool(user, parsed.data);
      router.push("/admin#schools");
    } catch (cause) {
      submitted.current = false;
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "Não foi possível criar a escola.");
    }
  }
  return { values, errors, error, saving, setField, handleSubmit };
}


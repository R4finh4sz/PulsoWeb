"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/interfaces/auth";
import { CoordinatorSchema, type CoordinatorForm } from "@/validation/Coordinator.validation";
import { useCoordinatorStore } from "@/store/coordinatorStore";

export function useCreateCoordinator(user: SessionUser) {
  const router = useRouter();
  const [values, setValues] = useState<CoordinatorForm>({ name: "", birthDate: "", registration: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof CoordinatorForm, string>>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);
  const addCoordinator = useCoordinatorStore((state) => state.addCoordinator);

  function setField(field: keyof CoordinatorForm, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    const parsed = CoordinatorSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof CoordinatorForm, string>> = {};
      for (const issue of parsed.error.issues) nextErrors[issue.path[0] as keyof CoordinatorForm] ??= issue.message;
      setErrors(nextErrors);
      event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    submitted.current = true;
    setSaving(true);
    try {
      addCoordinator(user, parsed.data);
      router.push("/admin#coordinators");
    } catch (cause) {
      submitted.current = false;
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o coordenador.");
    }
  }
  return { values, errors, error, saving, setField, handleSubmit };
}


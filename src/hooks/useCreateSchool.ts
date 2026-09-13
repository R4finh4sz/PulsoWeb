"use client";

import { useRef, useState, type SyntheticEvent } from "react";
import { SchoolSchema, type SchoolForm } from "@/validation/School.validation";
import { schoolsApi } from "@/integrations/schools/api";
import { useFeedbackStore } from "@/store/feedbackStore";

export function useCreateSchool() {
  const [values, setValues] = useState<SchoolForm>({ name: "", cnpj: "", street: "", neighborhood: "", state: "", city: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  function setField(field: keyof SchoolForm, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
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
      await schoolsApi.create({
        nome: parsed.data.name,
        cnpj: parsed.data.cnpj,
        logradouro: parsed.data.street,
        bairro: parsed.data.neighborhood,
        cidade: parsed.data.city,
      });
      showFeedback({ type: "success", message: "Escola cadastrada com sucesso." });
      setSaving(false);
    } catch (cause) {
      submitted.current = false;
      setSaving(false);
      showFeedback({ type: "error", message: cause instanceof Error ? cause.message : "Não foi possível criar a escola." });
    }
  }
  return { values, errors, saving, setField, handleSubmit };
}


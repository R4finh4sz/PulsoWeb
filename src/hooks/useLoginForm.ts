"use client";

import { useState, type FormEvent } from "react";
import { useLoginStore } from "@/store/loginStore";
import { LoginSchema, type LoginErrors, type LoginForm } from "@/validation/Login.validation";

export function useLoginForm() {
  const [values, setValues] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const submittedEmail = useLoginStore((state) => state.submittedEmail);
  const setSubmittedEmail = useLoginStore((state) => state.setSubmittedEmail);

  function setField(field: keyof LoginForm, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmittedEmail(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedEmail(null);
    const result = LoginSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: LoginErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if ((field === "email" || field === "password") && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      const firstField = nextErrors.email ? "email" : "password";
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${firstField}"]`)?.focus();
      return;
    }

    setErrors({});
    setSubmittedEmail(result.data.email);
  }

  return { values, errors, submittedEmail, setField, handleSubmit };
}
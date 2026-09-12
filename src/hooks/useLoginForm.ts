"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLoginStore } from "@/store/loginStore";
import { authService } from "@/services/auth";
import { homeRoutes } from "@/interfaces/auth";
import { LoginSchema, type LoginErrors, type LoginForm } from "@/validation/Login.validation";

export function useLoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [error, setError] = useState("");
  const setUser = useLoginStore((state) => state.setUser);

  function setField(field: keyof LoginForm, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
    try {
      const user = authService.login(result.data);
      setUser(user);
      router.replace(homeRoutes[user.role]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
    }
  }

  return { values, errors, error, setField, handleSubmit };
}

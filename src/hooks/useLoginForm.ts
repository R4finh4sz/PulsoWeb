"use client";
import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/integrations/auth/hooks";
import { toSessionUser } from "@/integrations/auth/session";
import { homeRoutes } from "@/interfaces/auth";
import { LoginSchema, type LoginErrors, type LoginForm } from "@/validation/Login.validation";
export function useLoginForm() {
  const router = useRouter();
  const login = useLogin();
  const submitted = useRef(false);
  const [values, setValues] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [error, setError] = useState("");
  function setField(field: keyof LoginForm, value: string) {
    setValues(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined })); setError("");
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    setError("");
    const parsed = LoginSchema.safeParse(values);
    if (!parsed.success) {
      const next: LoginErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]; if (key === "email" || key === "password") next[key] ??= issue.message;
      }
      setErrors(next); return;
    }
    setErrors({}); submitted.current = true;
    try {
      const user = await login.mutateAsync(parsed.data);
      setValues(current => ({ ...current, password: "" }));
      router.replace(homeRoutes[toSessionUser(user).role]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível entrar."); }
    finally { submitted.current = false; }
  }
  return { values, errors, error, saving: login.isPending, setField, handleSubmit };
}

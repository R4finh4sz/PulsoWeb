"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useLoginForm } from "@/hooks/useLoginForm";
import { LoginAction } from "../LoginAction";

export function LoginFields() {
  const { values, errors, error, saving, setField, handleSubmit } = useLoginForm();

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Input id="email" name="email" label="E-mail" type="email" autoComplete="username" required value={values.email} onChange={(event) => setField("email", event.target.value)} error={errors.email} placeholder="Digite seu e-mail..." />
      <div>
        <Input id="password" name="password" label="Senha" type="password" autoComplete="current-password" required value={values.password} onChange={(event) => setField("password", event.target.value)} error={errors.password} placeholder="Digite sua senha..." />
        <LoginAction />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} className="mt-4">{saving ? "Entrando…" : "Continuar"}</Button>
    </form>
  );
}

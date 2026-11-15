import { z } from "zod";

export const PasswordSchema = z
  .string()
  .refine(
    (password) => new TextEncoder().encode(password).length <= 72,
    "A senha deve ter no máximo 72 bytes UTF-8.",
  )
  .refine(
    (password) =>
      password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password),
    "A senha deve ter pelo menos 8 caracteres, uma letra maiúscula de A a Z e um número.",
  );

export function passwordError(password: string): string | null {
  const result = PasswordSchema.safeParse(password);
  return result.success ? null : result.error.issues[0].message;
}

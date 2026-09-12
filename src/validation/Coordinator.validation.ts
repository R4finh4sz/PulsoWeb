import { z } from "zod";

export function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date <= new Date();
}

export function isAtLeast18(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!hasHadBirthdayThisYear) age--;

  return age >= 18;
}

export const CoordinatorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo.")
    .max(50, "Use até 50 caracteres.")
    .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome."),
  birthDate: z
    .string()
    .refine(isValidBirthDate, "Informe uma data de nascimento válida, não futura.")
    .refine(isAtLeast18, "É necessário ter no mínimo 18 anos."),
  registration: z
    .string()
    .trim()
    .min(1, "Informe a matrícula.")
    .max(30, "Use até 30 caracteres.")
    .regex(/^[A-Za-z0-9-]+$/, "Use letras, números ou hífen.")
    .transform((value) => value.toUpperCase()),
});

export type CoordinatorForm = z.infer<typeof CoordinatorSchema>;
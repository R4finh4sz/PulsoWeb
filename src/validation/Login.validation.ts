import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Digite um e-mail válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

export type LoginForm = z.infer<typeof LoginSchema>;
export type LoginErrors = Partial<Record<keyof LoginForm, string>>;
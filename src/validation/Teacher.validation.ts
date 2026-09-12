import { z } from "zod";

export const TeacherSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo.").max(100, "Use até 100 caracteres."),
  email: z.email("Informe um email válido."),
  registration: z.string().trim().min(1, "Informe a matrícula.").max(30, "Use até 30 caracteres.").toUpperCase(),
});

export type TeacherForm = z.infer<typeof TeacherSchema>;

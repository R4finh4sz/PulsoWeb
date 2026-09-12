import { z } from "zod";

export const StudentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do aluno.").max(100, "Use até 100 caracteres."),
  email: z.string().trim().toLowerCase().email("Informe um email válido."),
  enrollment: z.string().trim().min(1, "Informe a matrícula.").max(50, "Use até 50 caracteres."),
  classroomId: z.string().min(1, "Selecione uma turma."),
});
export type StudentForm = z.infer<typeof StudentSchema>;

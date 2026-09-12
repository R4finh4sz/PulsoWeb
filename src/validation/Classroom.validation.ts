import { z } from "zod";

export const ClassroomSchema = z.object({
  year: z.string().regex(/^[1-3]$/, "Informe um ano de 1 ao 3."),
  identifier: z.string().trim().toUpperCase().regex(/^[A-Z]$/, "Informe uma letra de A a Z."),
  schoolId: z.string().min(1, "Selecione a escola."),
  teacherIds: z.array(z.string().min(1)).min(1, "Selecione pelo menos um professor.").refine((ids) => new Set(ids).size === ids.length, "Não repita professores."),
  period: z.enum(["Manhã", "Tarde", "Noite"], { error: "Selecione um turno." }),
});

export type ClassroomForm = z.infer<typeof ClassroomSchema>;


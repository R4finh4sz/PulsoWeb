import { z } from "zod";
import { ThemeNameSchema } from "./Theme.validation";

export const MAX_SYLLABUS_TOPICS = 15;
export const SubjectTopicSchema = z.object({
  title: ThemeNameSchema,
  description: z
    .string()
    .trim()
    .min(1, "Descreva o conteúdo do tópico.")
    .max(2000, "Use até 2.000 caracteres na descrição."),
  references: z
    .string()
    .trim()
    .max(4000, "Use até 4.000 caracteres nas referências."),
});
export const CreateSubjectSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da disciplina.").max(100),
    syllabus: z
      .string()
      .trim()
      .max(5000, "Use até 5.000 caracteres na ementa."),
    topics: z
      .array(SubjectTopicSchema)
      .min(1, "Preencha ao menos um tópico com título e descrição.")
      .max(MAX_SYLLABUS_TOPICS, "Adicione no máximo 15 tópicos."),
  })
  .superRefine(({ topics }, context) => {
    const seen = new Set<string>();
    topics.forEach((topic, index) => {
      const title = topic.title.toLocaleLowerCase("pt-BR");
      if (seen.has(title))
        context.addIssue({
          code: "custom",
          path: ["topics", index, "title"],
          message: "Use títulos diferentes para os temas.",
        });
      seen.add(title);
    });
  });
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type SubjectTopic = z.infer<typeof SubjectTopicSchema>;

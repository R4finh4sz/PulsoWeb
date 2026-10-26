import { z } from "zod";

export const QuizQuestionSchema = z
  .object({
    question: z.string().trim().min(1, "Informe a pergunta.").max(1000),
    options: z
      .array(
        z.string().trim().min(1, "Preencha as quatro alternativas.").max(500),
      )
      .length(4),
    theme: z.string().trim().min(1, "Selecione um tema."),
    correctOption: z.number().int().min(0, "Marque a resposta correta.").max(3),
  })
  .superRefine((value, context) => {
    const options = value.options.map((option) => option.toLocaleLowerCase("pt-BR"));
    options.forEach((option, index) => {
      if (option && options.some((other, otherIndex) => otherIndex !== index && other === option))
        context.addIssue({ code: "custom", message: "As quatro alternativas devem ser diferentes.", path: ["options", index] });
    });
  });

export const CreateQuizSchema = z.object({
  closesAt: z.iso.datetime().optional(),
  questions: z
    .array(QuizQuestionSchema)
    .length(10, "O quiz deve conter exatamente 10 questões."),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type CreateQuiz = z.infer<typeof CreateQuizSchema>;

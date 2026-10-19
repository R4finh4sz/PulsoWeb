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
  .refine(
    (value) =>
      new Set(value.options.map((option) => option.toLocaleLowerCase("pt-BR")))
        .size === 4,
    {
      message: "As quatro alternativas devem ser diferentes.",
      path: ["options"],
    },
  );

export const CreateQuizSchema = z.object({
  closesAt: z.iso.datetime().optional(),
  questions: z
    .array(QuizQuestionSchema)
    .length(10, "O quiz deve conter exatamente 10 questões."),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type CreateQuiz = z.infer<typeof CreateQuizSchema>;

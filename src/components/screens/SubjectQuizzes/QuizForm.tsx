"use client";

import { useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  CreateQuizSchema,
  QuizQuestionSchema,
  type CreateQuiz,
  type QuizQuestion,
} from "@/validation/Quiz.validation";
import {
  actionClass,
  fieldClass,
} from "@/components/screens/Integration/shared";
import { useUnsavedQuiz } from "./useUnsavedQuiz";

export function QuizForm({
  themes,
  pending,
  onSubmit,
  onCancel,
}: {
  themes: string[];
  pending: boolean;
  onSubmit: (quiz: CreateQuiz) => Promise<void>;
  onCancel: () => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    Array.from({ length: 10 }, () => ({
      question: "",
      options: ["", "", "", ""],
      theme: "",
      correctOption: -1,
    })),
  );
  const [active, setActive] = useState(0);
  const [closesAt, setClosesAt] = useState(() => {
    const date = new Date(Date.now() + 7 * 86400000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [deadlineChanged, setDeadlineChanged] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const current = questions[active];
  const valid = (question: QuizQuestion) =>
    QuizQuestionSchema.safeParse(question).success &&
    themes.includes(question.theme);
  const completed = questions.filter(valid).length;
  const dirty = questions.some(
    (question) =>
      question.question !== "" ||
      question.options.some((option) => option !== "") ||
      question.theme !== "" ||
      question.correctOption !== -1,
  );
  const { requestExit, confirmation } = useUnsavedQuiz(
    dirty || deadlineChanged,
    pending,
  );
  function update(value: Partial<QuizQuestion>) {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === active ? { ...question, ...value } : question,
      ),
    );
    setError("");
  }
  function navigate(index: number) {
    setActive(index);
    setError("");
    heading.current?.focus();
  }
  async function submit() {
    const deadline = new Date(closesAt);
    if (
      !closesAt ||
      !Number.isFinite(deadline.getTime()) ||
      deadline.getTime() <= Date.now()
    ) {
      setError("Escolha uma data de encerramento no futuro.");
      return;
    }
    const result = CreateQuizSchema.safeParse({
      questions,
      closesAt: deadline.toISOString(),
    });
    const firstInvalid = questions.findIndex((question) => !valid(question));
    if (!result.success || firstInvalid !== -1) {
      setActive(Math.max(0, firstInvalid));
      setError(
        "Complete a pergunta, as quatro alternativas diferentes, o tema e a resposta correta de todas as 10 questões.",
      );
      heading.current?.focus();
      return;
    }
    try {
      await onSubmit(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o quiz. Tente novamente.",
      );
    }
  }
  return (
    <section aria-label="Criar quiz" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Criar quiz</h2>
        <p className="mt-2 text-sm text-(--muted)">
          São obrigatórias 10 questões, cada uma com 4 alternativas e uma
          resposta correta.
        </p>
      </div>
      <label className="block max-w-sm text-sm font-medium">
        Data de encerramento
        <input
          type="datetime-local"
          required
          value={closesAt}
          disabled={pending}
          onChange={(event) => {
            setClosesAt(event.target.value);
            setDeadlineChanged(true);
            setError("");
          }}
          className={fieldClass}
        />
      </label>
      <p role="status" className="text-sm font-medium text-(--blue-dark)">
        {completed} de 10 questões concluídas
      </p>
      <nav aria-label="Questões do quiz" className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            type="button"
            disabled={pending}
            aria-label={`Questão ${index + 1}${valid(question) ? ", concluída" : ", pendente"}`}
            aria-current={active === index ? "step" : undefined}
            onClick={() => navigate(index)}
            className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-(--line) bg-white px-2 text-sm text-(--ink) aria-[current=step]:border-[var(--blue-dark)] aria-[current=step]:bg-cyan-50 aria-[current=step]:font-semibold"
          >
            {index + 1}
            {valid(question) && (
              <Check
                size={13}
                aria-hidden="true"
                className="text-emerald-700"
              />
            )}
          </button>
        ))}
      </nav>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-6 rounded-2xl border border-(--line) bg-white p-5 sm:p-7"
      >
        <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
          Questão {active + 1} de 10
        </h3>
        <fieldset disabled={pending} className="space-y-5">
          <legend className="sr-only">Conteúdo da questão {active + 1}</legend>
          <label className="block text-sm font-medium" htmlFor="quiz-theme">
            Tema
            <select
              id="quiz-theme"
              required
              value={current.theme}
              onChange={(event) => update({ theme: event.target.value })}
              className={fieldClass}
            >
              <option value="">Selecione um tema</option>
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium" htmlFor="quiz-question">
            Pergunta
            <textarea
              id="quiz-question"
              required
              maxLength={1000}
              rows={3}
              value={current.question}
              onChange={(event) => update({ question: event.target.value })}
              className={`${fieldClass} resize-y`}
              placeholder="Escreva a pergunta desta questão"
            />
          </label>
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-medium">
              Alternativas{" "}
              <span className="font-normal text-(--muted)">
                · marque a correta
              </span>
            </legend>
            {current.options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct-option"
                  aria-label={`Alternativa ${"ABCD"[index]} correta`}
                  checked={current.correctOption === index}
                  onChange={() => update({ correctOption: index })}
                  className="h-5 w-5 shrink-0 accent-[var(--blue-dark)]"
                />
                <label
                  className="min-w-0 flex-1 text-sm font-medium"
                  htmlFor={`quiz-option-${index}`}
                >
                  Alternativa {"ABCD"[index]}
                  <input
                    id={`quiz-option-${index}`}
                    required
                    maxLength={500}
                    value={option}
                    onChange={(event) =>
                      update({
                        options: current.options.map((value, optionIndex) =>
                          optionIndex === index ? event.target.value : value,
                        ),
                      })
                    }
                    className={fieldClass}
                    placeholder={`Resposta ${"ABCD"[index]}`}
                  />
                </label>
              </div>
            ))}
          </fieldset>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--line) pt-5">
          <button
            type="button"
            disabled={pending}
            onClick={() => requestExit(onCancel)}
            className="min-h-11 rounded-lg px-3 text-sm text-(--muted) hover:bg-slate-50"
          >
            Cancelar
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={active === 0 || pending}
              onClick={() => navigate(active - 1)}
              className="flex min-h-11 items-center gap-1 rounded-xl border border-(--line) px-3 text-sm disabled:opacity-40"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Anterior
            </button>
            {active < 9 ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => navigate(active + 1)}
                className={actionClass}
              >
                Próxima
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" disabled={pending} className={actionClass}>
                {pending ? "Criando…" : "Criar e abrir quiz"}
              </button>
            )}
          </div>
        </div>
      </form>
      {confirmation}
    </section>
  );
}

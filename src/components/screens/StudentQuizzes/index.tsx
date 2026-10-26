"use client";

import { ApiError } from "@/api/client";
import {
  ErrorMessage,
  Protected,
  Workspace,
  actionClass,
} from "@/components/screens/Integration/shared";
import { quizzesApi, type Submission } from "@/integrations/quizzes/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";

export function StudentQuizzes() {
  return (
    <Protected role="aluno">
      {(user) => (
        <Workspace user={user} title="Quizzes da turma">
          <QuizList />
        </Workspace>
      )}
    </Protected>
  );
}

function QuizList() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ["student-quizzes"],
    queryFn: ({ signal }) => quizzesApi.studentList(signal),
    refetchInterval: 30000,
  });
  return (
    <div className="space-y-4">
      <ErrorMessage error={query.error} />
      {query.isPending && <p role="status">Carregando quizzes…</p>}
      {query.isError && (
        <button className={actionClass} onClick={() => query.refetch()}>
          Tentar novamente
        </button>
      )}
      {query.data?.length === 0 && (
        <p>Nenhum quiz disponível para sua turma.</p>
      )}
      {query.data?.map((quiz) => (
        <Link
          className="block rounded-xl border bg-white p-5"
          href={`/student/quizzes/${quiz.id}`}
          key={quiz.id}
        >
          <h2 className="font-semibold">
            Quiz {quiz.id}
            {quiz.subjectName && ` · ${quiz.subjectName}`}
          </h2>
          <p>
            {quiz.submittedAt
              ? "Entregue · Ver resultado"
              : Date.parse(quiz.closesAt) <= now || quiz.status === "CLOSED"
                ? "Prazo encerrado"
                : "Responder quiz"}
          </p>
          <p>Encerra em {new Date(quiz.closesAt).toLocaleString("pt-BR")}</p>
        </Link>
      ))}
    </div>
  );
}

export function StudentQuiz({ id }: { id: number }) {
  return (
    <Protected role="aluno">
      {(user) => (
        <Workspace user={user} title={`Quiz ${id}`}>
          {Number.isSafeInteger(id) && id > 0 ? (
            <AnswerQuiz key={id} id={id} />
          ) : (
            <p role="alert">Quiz inválido.</p>
          )}
        </Workspace>
      )}
    </Protected>
  );
}

function Correction({ result }: { result: Submission }) {
  return (
    <section className="space-y-5" aria-label="Resultado do quiz">
      <h2 className="text-xl font-semibold">
        Nota: {result.score.grade} · {result.score.correct}/{result.score.total}{" "}
        acertos
      </h2>
      <p>Entregue em {new Date(result.submittedAt).toLocaleString("pt-BR")}</p>
      <ul>
        {result.score.themes.map((theme) => (
          <li key={theme.theme}>
            {theme.theme}: {theme.errors} erro(s) em {theme.total} questão(ões)
          </li>
        ))}
      </ul>
      <ol className="space-y-4">
        {result.score.review.map((item, index) => (
          <li className="rounded-xl border bg-white p-5" key={index}>
            <h3>
              {index + 1}. {item.question}
            </h3>
            <p>
              {item.isCorrect ? "Correta" : "Incorreta"} · {item.theme}
            </p>
            <p>Sua resposta: {item.answer ?? "Não respondida"}</p>
            <p>Resposta correta: {item.correctAnswer}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AnswerQuiz({ id }: { id: number }) {
  const client = useQueryClient();
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(10).fill(null),
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const quiz = useQuery({
    queryKey: ["student-quiz", id],
    queryFn: ({ signal }) => quizzesApi.get(id, signal),
  });
  const result = useQuery({
    queryKey: ["student-quiz-result", id],
    queryFn: async ({ signal }) => {
      try {
        return await quizzesApi.result(id, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    retry: false,
  });
  const submit = useMutation({
    mutationFn: () => quizzesApi.submit(id, answers),
    retry: false,
    onSuccess: async (data) => {
      client.setQueryData(["student-quiz-result", id], data);
      await client.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
  if (result.data) return <Correction result={result.data} />;
  if (quiz.isPending || result.isPending)
    return <p role="status">Carregando quiz…</p>;
  if (quiz.error || result.error)
    return (
      <div className="space-y-4">
        <ErrorMessage error={quiz.error || result.error} />
        <button
          className={actionClass}
          onClick={() => {
            void quiz.refetch();
            void result.refetch();
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  if (!quiz.data) return null;
  const closed =
    quiz.data.status === "CLOSED" || Date.parse(quiz.data.closesAt) <= now;
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!closed && !submit.isPending && !submit.isSuccess) submit.mutate();
      }}
    >
      <p>
        Encerra em {new Date(quiz.data.closesAt).toLocaleString("pt-BR")}.
        Questões em branco serão enviadas como não respondidas.
      </p>
      {closed && (
        <p role="status">Prazo encerrado. Entregas estão bloqueadas.</p>
      )}
      {quiz.data.questions.map((question, index) => (
        <fieldset
          disabled={closed || submit.isPending || submit.isSuccess}
          className="space-y-3 rounded-xl border bg-white p-5"
          key={index}
        >
          <legend>
            {index + 1}. {question.question}
          </legend>
          <p>Tema: {question.theme}</p>
          {question.options.map((option, optionIndex) => (
            <label key={optionIndex} className="block">
              <input
                type="radio"
                name={`question-${index}`}
                checked={answers[index] === optionIndex}
                onChange={() =>
                  setAnswers((previous) =>
                    previous.map((answer, i) =>
                      i === index ? optionIndex : answer,
                    ),
                  )
                }
              />{" "}
              {option}
            </label>
          ))}
          <button
            type="button"
            onClick={() =>
              setAnswers((previous) =>
                previous.map((answer, i) => (i === index ? null : answer)),
              )
            }
          >
            Limpar resposta
          </button>
        </fieldset>
      ))}
      <ErrorMessage error={submit.error} />
      <button
        className={actionClass}
        disabled={
          closed ||
          submit.isPending ||
          submit.isSuccess ||
          quiz.data.questions.length !== 10
        }
      >
        {submit.isPending ? "Enviando…" : "Finalizar e ver correção"}
      </button>
    </form>
  );
}

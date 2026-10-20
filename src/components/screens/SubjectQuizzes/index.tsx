"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  ErrorMessage,
  Protected,
  actionClass,
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthState } from "@/integrations/auth/state";
import { useClassroom } from "@/integrations/classrooms/hooks";
import { quizzesApi } from "@/integrations/quizzes/api";
import { subjectsApi } from "@/integrations/subjects/api";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import type { CreateQuiz } from "@/validation/Quiz.validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, LockKeyhole, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { QuizForm } from "./QuizForm";
import { canAccessSubject } from "@/utils/subjectAccess";

function Content({
  classroomId,
  subjectId,
  teacherId,
}: {
  classroomId: number;
  subjectId: number;
  teacherId: number;
}) {
  const [creating, setCreating] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const token = useAuthState((state) => state.session?.accessToken);
  const demo = mockAccessEnabled && !!getDemoUser(token);
  const client = useQueryClient();
  const room = useClassroom(classroomId);
  const subjects = useQuery({
    queryKey: ["subjects", classroomId],
    queryFn: ({ signal }) => subjectsApi.list(classroomId, signal),
  });
  const subject = subjects.data?.find((subject) => subject.id === subjectId);
  const allowed = !!subject && canAccessSubject(subject, teacherId);
  const queryKey = ["quizzes", classroomId, subjectId];
  const quizzes = useQuery({
    queryKey,
    queryFn: ({ signal }) => quizzesApi.list(classroomId, subjectId, signal),
    enabled: demo && allowed,
    refetchInterval: 30000,
  });
  const themes = useQuery({
    queryKey: ["quiz-themes", classroomId, subjectId],
    queryFn: ({ signal }) => quizzesApi.themes(classroomId, subjectId, signal),
    enabled: demo && allowed,
  });
  const create = useMutation({
    mutationFn: (body: CreateQuiz) =>
      quizzesApi.create(classroomId, subjectId, body),
    onSuccess: async (quiz) => {
      client.setQueryData<import("@/integrations/quizzes/api").Quiz[]>(
        queryKey,
        (previous) => [...(previous ?? []), quiz],
      );
      setCreating(false);
      setSuccess(true);
    },
  });
  if (subjects.isPending || room.isPending)
    return <p role="status">Carregando matéria…</p>;
  if (subjects.error || room.error)
    return (
      <div className="space-y-4">
        <ErrorMessage error={subjects.error || room.error} />
        <button
          className={actionClass}
          onClick={() => {
            void subjects.refetch();
            void room.refetch();
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  if (!subject)
    return (
      <p role="alert">Matéria não encontrada ou não vinculada ao seu perfil.</p>
    );
  if (!allowed)
    return (
      <div className="space-y-4">
        <BackLink />
        <LockKeyhole size={28} aria-hidden="true" />
        <p role="alert">
          Aceite o convite do professor responsável para acessar esta matéria.
        </p>
      </div>
    );
  return (
    <div className="space-y-8">
      <BackLink />
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)"
        >
          <BookOpen size={29} strokeWidth={1.7} />
        </span>
        <div>
          <h1 className="page-title break-words">{subject.name}</h1>
          <p className="page-description mt-2">
            {room.data?.name} · Quizzes da matéria
          </p>
        </div>
      </div>
      {!demo ? (
        <p className="rounded-xl border border-(--line) bg-white p-6 text-sm text-(--muted)">
          A criação de quizzes está disponível no acesso de demonstração. A
          integração com o backend ainda será conectada.
        </p>
      ) : (
        <>
          <ErrorMessage error={quizzes.error || themes.error} />
          {(quizzes.isError || themes.isError) && (
            <button
              className={actionClass}
              onClick={() => {
                void quizzes.refetch();
                void themes.refetch();
              }}
            >
              Tentar novamente
            </button>
          )}
          {success && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              Quiz criado com 10 questões e aberto nesta matéria.
            </p>
          )}
          {creating && themes.data ? (
            <QuizForm
              themes={themes.data}
              pending={create.isPending}
              onCancel={() => setCreating(false)}
              onSubmit={async (body) => {
                await create.mutateAsync(body);
              }}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Quizzes abertos</h2>
                <button
                  disabled={
                    !themes.data?.length || quizzes.isPending || themes.isError
                  }
                  onClick={() => {
                    setCreating(true);
                    setSuccess(false);
                  }}
                  className={actionClass}
                >
                  <Plus size={18} aria-hidden="true" />
                  Criar quiz
                </button>
              </div>
              {(quizzes.isPending || themes.isPending) && (
                <p role="status">Carregando quizzes e temas…</p>
              )}
              {quizzes.isSuccess &&
                !quizzes.data.some((quiz) => quiz.status === "OPEN") && (
                  <EmptyState
                    icon={BookOpen}
                    title="Nenhum quiz aberto"
                    description={`Crie o primeiro quiz de ${subject.name} com 10 questões.`}
                  />
                )}
              <ul className="space-y-4">
                {quizzes.data
                  ?.filter((quiz) => quiz.status === "OPEN")
                  .map((quiz) => (
                    <li
                      key={quiz.id}
                      className="rounded-2xl border border-(--line) bg-white p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold">
                          Quiz {quiz.id}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                            Aberto
                          </span>
                          <details
                            className="relative"
                            onBlur={(event) => {
                              if (
                                !event.currentTarget.contains(
                                  event.relatedTarget,
                                )
                              )
                                event.currentTarget.open = false;
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.currentTarget.open = false;
                                event.currentTarget
                                  .querySelector("summary")
                                  ?.focus();
                              }
                            }}
                          >
                            <summary
                              aria-label={`Opções do quiz ${quiz.id}`}
                              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-(--muted) hover:bg-cyan-50 [&::-webkit-details-marker]:hidden"
                            >
                              <MoreHorizontal size={22} aria-hidden="true" />
                            </summary>
                            <div className="absolute right-0 top-full z-10 mt-1 w-60 rounded-xl border border-(--line) bg-white p-1.5 shadow-lg">
                              <Link
                                href={`/teacher/activities/${quiz.id}`}
                                className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-cyan-50"
                              >
                                Ver quiz e resultados
                              </Link>
                              <button
                                type="button"
                                aria-expanded={expandedQuiz === quiz.id}
                                aria-controls={`quiz-questions-${quiz.id}`}
                                onClick={(event) => {
                                  setExpandedQuiz(
                                    expandedQuiz === quiz.id ? null : quiz.id,
                                  );
                                  const menu =
                                    event.currentTarget.closest("details");
                                  if (menu) {
                                    menu.open = false;
                                    menu.querySelector("summary")?.focus();
                                  }
                                }}
                                className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-cyan-50"
                              >
                                {expandedQuiz === quiz.id
                                  ? "Ocultar questões"
                                  : "Ver questões"}
                              </button>
                            </div>
                          </details>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-(--muted)">
                        {quiz.questions.length} questões ·{" "}
                        {new Date(quiz.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      {expandedQuiz === quiz.id && (
                        <div
                          id={`quiz-questions-${quiz.id}`}
                          className="mt-5 border-t border-(--line) pt-5"
                        >
                          <h4 className="text-base font-semibold">
                            Questões do quiz
                          </h4>
                          <ol className="mt-4 list-decimal space-y-5 pl-5">
                            {quiz.questions.map((question, index) => (
                              <li key={index}>
                                <p className="break-words text-sm font-medium">
                                  {question.question}
                                </p>
                                <p className="mt-1 text-xs text-(--muted)">
                                  Tema: {question.theme}
                                </p>
                                <ul className="mt-2 space-y-1">
                                  {question.options.map(
                                    (option, optionIndex) => (
                                      <li
                                        key={optionIndex}
                                        className="break-words text-sm"
                                      >
                                        {"ABCD"[optionIndex]}. {option}
                                        {question.correctOption ===
                                          optionIndex && (
                                          <span className="ml-2 font-medium text-emerald-800">
                                            (correta)
                                          </span>
                                        )}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function SubjectQuizzes({
  classroomId,
  subjectId,
}: {
  classroomId: number;
  subjectId: number;
}) {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          {Number.isSafeInteger(classroomId) &&
          classroomId > 0 &&
          Number.isSafeInteger(subjectId) &&
          subjectId > 0 ? (
            <Content
              key={`${classroomId}:${subjectId}`}
              classroomId={classroomId}
              subjectId={subjectId}
              teacherId={Number(user.id)}
            />
          ) : (
            <p role="alert">Matéria inválida.</p>
          )}
        </TeacherShell>
      )}
    </Protected>
  );
}

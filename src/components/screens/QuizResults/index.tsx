"use client";
import { normalizeText } from "@/utils/text";

import {
  ErrorMessage,
  actionClass
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthState } from "@/integrations/auth/state";
import { quizzesApi } from "@/integrations/quizzes/api";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Search, Users } from "lucide-react";
import { useState } from "react";

export function Results({ quizId }: { quizId: number; }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const token = useAuthState((state) => state.session?.accessToken);
  const demo = mockAccessEnabled && !!getDemoUser(token);
  const query = useQuery({
    queryKey: ["quiz-results", quizId, token],
    queryFn: ({ signal }) => quizzesApi.results(quizId, signal),
    enabled: demo,
    refetchInterval: 30000,
  });
  if (!demo)
    return (
      <EmptyState
        icon={ClipboardList}
        title="Resultados indisponíveis neste ambiente."
      />
    );
  if (query.isPending) return <p role="status">Carregando resultados…</p>;
  if (query.error || !query.data)
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorMessage error={query.error} />
        <button className={actionClass} onClick={() => query.refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  const { quiz, students } = query.data;
  const filtered = students
    .filter(
      (student) =>
        normalizeText(`${student.name} ${student.ra}`).includes(
          normalizeText(search.trim()),
        ) &&
        (filter === "ALL" ||
          (filter === "SUBMITTED" ? !!student.score : !student.score)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages - 1);
  const answered = students.filter((student) => student.score !== null).length;
  return (
    <div className="space-y-8">
      <BackLink />
      <div>
        <h1 className="page-title">
          Quiz {quiz.id} · {quiz.subjectName}
        </h1>
        <p className="page-description mt-3">
          {quiz.classroomName} · {quiz.schoolName}
        </p>
        <p
          className={`mt-3 inline-flex rounded-lg px-3 py-1.5 text-sm font-medium ${quiz.status === "OPEN" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
        >
          {quiz.status === "OPEN"
            ? "Em aberto · Resultados parciais"
            : "Finalizado"}
        </p>
      </div>
      <section aria-label="Resultados por aluno" className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Resultados por aluno</h2>
          <p className="mt-2 text-sm text-(--muted)">
            {answered} de {students.length} alunos responderam · Notas de 0 a 10
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-(--line) bg-white px-4 py-3">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar aluno por nome ou RA"
              placeholder="Buscar por nome ou RA"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              className="min-w-0 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select
            aria-label="Filtrar respostas"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(0);
            }}
            className="min-h-12 rounded-xl border border-(--line) bg-white px-3 text-sm"
          >
            <option value="ALL">Todos os alunos</option>
            <option value="SUBMITTED">Responderam</option>
            <option value="PENDING">Não responderam</option>
          </select>
        </div>
        {!filtered.length && (
          <EmptyState icon={Users} title="Nenhum aluno encontrado." />
        )}
        <ul className="space-y-3">
          {filtered.slice(current * 10, current * 10 + 10).map((student) => (
            <li
              key={student.studentId}
              className="rounded-2xl border border-(--line) bg-white p-5"
            >
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 rounded-lg [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold">
                      {student.name}
                    </span>
                    <span className="mt-1 block text-xs text-(--muted)">
                      RA: {student.ra}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="text-sm font-semibold tabular-nums text-(--ink)">
                      {student.score
                        ? `${student.score.grade.toLocaleString("pt-BR")} / 10`
                        : "Não respondeu"}
                    </span>
                    <span className="text-xs font-medium text-(--blue-dark)">
                      Ver detalhes
                    </span>
                  </span>
                </summary>
                {student.score ? (
                  <div className="mt-5 space-y-5 border-t border-(--line) pt-5">
                    <p className="text-sm text-(--muted)">
                      {student.score.correct} de {student.score.total} acertos
                    </p>
                    <div>
                      <h3 className="text-base font-semibold">
                        Temas com mais erros
                      </h3>
                      {student.score.themes.length ? (
                        <ul className="mt-3 space-y-2">
                          {student.score.themes.map((theme) => (
                            <li
                              key={theme.theme}
                              className="flex flex-wrap justify-between gap-2 text-sm"
                            >
                              <span>{theme.theme}</span>
                              <span className="font-medium text-red-700">
                                {theme.errors}{" "}
                                {theme.errors === 1 ? "erro" : "erros"} em{" "}
                                {theme.total} questões
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-emerald-800">
                          Nenhum erro. Todas as questões foram respondidas
                          corretamente.
                        </p>
                      )}
                    </div>
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-(--blue-dark)">
                        Respostas por questão
                      </summary>
                      <ol className="mt-4 list-decimal space-y-4 pl-5">
                        {student.score.review.map((answer, index) => (
                          <li key={index} className="text-sm">
                            <p className="break-words font-medium">
                              {answer.question}
                            </p>
                            <p className="mt-1 text-xs text-(--muted)">
                              {answer.theme} ·{" "}
                              {answer.isCorrect ? "Correta" : "Incorreta"}
                            </p>
                            <p className="mt-2 break-words">
                              Resposta: {answer.answer ?? "Sem resposta"}
                            </p>
                            {!answer.isCorrect && (
                              <p className="break-words text-emerald-800">
                                Resposta correta: {answer.correctAnswer}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </details>
                  </div>
                ) : (
                  <p className="mt-5 border-t border-(--line) pt-5 text-sm text-(--muted)">
                    {quiz.status === "OPEN"
                      ? "Aguardando a resposta do aluno."
                      : "O aluno não respondeu até o encerramento."}{" "}
                    Ainda não há nota ou análise de temas.
                  </p>
                )}
              </details>
            </li>
          ))}
        </ul>
        {pages > 1 && (
          <nav
            aria-label="Paginação dos resultados"
            className="flex items-center justify-end gap-3"
          >
            <button
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="min-h-11 rounded-xl border border-(--line) px-3 text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm tabular-nums">
              {current + 1} de {pages}
            </span>
            <button
              disabled={current + 1 >= pages}
              onClick={() => setPage(current + 1)}
              className="min-h-11 rounded-xl border border-(--line) px-3 text-sm disabled:opacity-40"
            >
              Próxima
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

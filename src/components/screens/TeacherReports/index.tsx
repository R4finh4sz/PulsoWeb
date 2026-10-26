"use client";
import { normalizeText } from "@/utils/text";

import {
  ErrorMessage,
  actionClass,
  fieldClass
} from "@/components/screens/Integration/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthState } from "@/integrations/auth/state";
import { quizzesApi } from "@/integrations/quizzes/api";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import { buildClassroomReports, reportMetrics } from "@/utils/teacherReports";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChartColumn, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SchoolReport } from "./SchoolReport";

const number = (value: number | null, suffix = "") =>
  value === null
    ? "—"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;

function Completion({ value }: { value: number | null; }) {
  return (
    <div className="flex min-w-32 items-center gap-3">
      <div
        aria-hidden="true"
        className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-(--blue-dark)"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
      <span className="tabular-nums">{number(value, "%")}</span>
    </div>
  );
}

export function Reports({
  classroomId,
  initialStatus,
}: {
  classroomId?: number;
  initialStatus: "ALL" | "CLOSED";
}) {
  const token = useAuthState((state) => state.session?.accessToken);
  const demo = mockAccessEnabled && !!getDemoUser(token);
  const [school, setSchool] = useState("");
  const [classroom, setClassroom] = useState("");
  const [status, setStatus] = useState<string>(initialStatus);
  const [search, setSearch] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["teacher-report", token],
    queryFn: async ({ signal }) => {
      const activities = await quizzesApi.activities(signal);
      const results = await Promise.all(
        activities.map((activity) => quizzesApi.results(activity.id, signal)),
      );
      return { results, asOf: Date.now() };
    },
    enabled: demo,
  });

  const asOf = query.data?.asOf ?? 0;
  const results = (query.data?.results ?? []).filter(
    ({ quiz }) =>
      status === "ALL" ||
      quiz.status === "CLOSED" ||
      Date.parse(quiz.closesAt) <= asOf,
  );
  const reports = buildClassroomReports(results, asOf);
  const allReports = buildClassroomReports(query.data?.results ?? [], asOf);
  const schools = [...new Set(allReports.map((report) => report.school))];
  const selected = reports.find((report) => report.id === classroomId);
  const knownClassroom = allReports.find((report) => report.id === classroomId);
  const visible = reports.filter((report) =>
    classroomId !== undefined
      ? report.id === classroomId
      : (!school || report.school === school) &&
      (!classroom || String(report.id) === classroom),
  );
  const metrics = reportMetrics(visible.flatMap((report) => report.students));
  const filteredStudents = (selected?.students ?? []).filter(
    (student) =>
      normalizeText(`${student.name} ${student.ra}`).includes(
        normalizeText(search.trim()),
      ) &&
      (!attentionOnly || student.overdue > 0),
  );
  const pages = Math.max(1, Math.ceil(filteredStudents.length / 15));
  const current = Math.min(page, pages - 1);
  const statusQuery = status === "CLOSED" ? "?status=CLOSED" : "";

  return (
    <div className="space-y-8">
      {classroomId !== undefined && (
        <Link
          href={`/teacher/reports${statusQuery}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-(--blue-dark)"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Voltar
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="page-title">
            {classroomId === undefined
              ? "Relatório de aprendizagem"
              : knownClassroom
                ? `Relatório · ${knownClassroom.name}`
                : "Relatório da turma"}
          </h1>
          <p className="page-description mt-3 max-w-2xl">
            {classroomId === undefined
              ? "Veja como suas turmas estão aprendendo e participando das atividades."
              : `${knownClassroom?.school ?? "Acompanhamento por aluno"} · Notas e entregas das atividades da turma.`}
          </p>
        </div>
      </div>
      {!demo ? (
        <EmptyState
          icon={ChartColumn}
          title="Relatório indisponível neste ambiente."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            {classroomId === undefined && (
              <>
                <label className="min-w-0 flex-1 basis-52 text-sm font-medium">
                  Escola
                  <select
                    value={school}
                    onChange={(event) => {
                      setSchool(event.target.value);
                      setClassroom("");
                    }}
                    className={`${fieldClass} mt-2 w-full`}
                  >
                    <option value="">Todas as escolas</option>
                    {schools.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 flex-1 basis-44 text-sm font-medium">
                  Turma
                  <select
                    value={classroom}
                    onChange={(event) => setClassroom(event.target.value)}
                    className={`${fieldClass} mt-2 w-full`}
                  >
                    <option value="">Todas as turmas</option>
                    {allReports
                      .filter((report) => !school || report.school === school)
                      .map((report) => (
                        <option key={report.id} value={report.id}>
                          {report.name}
                          {!school ? ` · ${report.school}` : ""}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            )}
            <label className="min-w-0 flex-1 basis-52 text-sm font-medium">
              Atividades consideradas
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
                className={`${fieldClass} mt-2 w-full`}
              >
                <option value="ALL">Todas as atividades</option>
                <option value="CLOSED">Somente encerradas</option>
              </select>
            </label>
          </div>
          {query.isPending && <p role="status">Preparando relatório…</p>}
          <ErrorMessage error={query.error} />
          {query.isError && (
            <div className="space-y-3">
              <p className="text-sm text-(--muted)">
                Não foi possível reunir todos os resultados. Tente carregar o
                relatório novamente.
              </p>
              <button
                type="button"
                className={actionClass}
                onClick={() => query.refetch()}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {query.isSuccess && (
            <>
              {!visible.length ? (
                <EmptyState
                  icon={ChartColumn}
                  title={
                    classroomId !== undefined && !knownClassroom
                      ? "Turma sem atividades disponíveis para este relatório."
                      : "Nenhuma atividade encontrada neste recorte."
                  }
                />
              ) : (
                <>
                  <section
                    aria-label="Resumo do recorte"
                    className="rounded-2xl border border-(--line) bg-white px-6 py-6"
                  >
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
                      {[
                        [
                          "Média das notas",
                          `${number(metrics.average)}${metrics.average === null ? "" : " / 10"}`,
                          "Somente atividades respondidas",
                        ],
                        [
                          "Atividades entregues",
                          number(metrics.completion, "%"),
                          `${metrics.submitted} de ${metrics.assigned} entregas previstas`,
                        ],
                        [
                          "Alunos com pendências",
                          String(metrics.attention),
                          "Com atividades encerradas sem entrega",
                        ],
                        [
                          classroomId === undefined
                            ? "Turmas no recorte"
                            : "Alunos no recorte",
                          String(
                            classroomId === undefined
                              ? visible.length
                              : (selected?.students.length ?? 0),
                          ),
                          `${visible.reduce((sum, report) => sum + report.activities, 0)} atividades consideradas`,
                        ],
                      ].map(([label, value, description]) => (
                        <div key={label}>
                          <dt className="text-sm text-(--muted)">{label}</dt>
                          <dd className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">
                            {value}
                          </dd>
                          <dd className="mt-2 text-xs text-(--muted)">
                            {description}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  {classroomId === undefined ? (
                    <section
                      aria-labelledby="classrooms-heading"
                      className="space-y-5"
                    >
                      <div>
                        <h2
                          id="classrooms-heading"
                          className="text-xl font-semibold"
                        >
                          Escolas e turmas
                        </h2>
                        <p className="mt-2 text-sm text-(--muted)">
                          Abra uma turma para identificar quem precisa de
                          acompanhamento.
                        </p>
                      </div>
                      {[...new Set(visible.map((report) => report.school))].map(
                        (name) => {
                          const rooms = visible.filter(
                            (report) => report.school === name,
                          );
                          return (
                            <SchoolReport
                              key={name}
                              name={name}
                              rooms={rooms}
                              statusQuery={statusQuery}
                            />
                          );
                        },
                      )}
                    </section>
                  ) : (
                    <section
                      aria-labelledby="students-heading"
                      className="space-y-5"
                    >
                      <h2
                        id="students-heading"
                        className="text-xl font-semibold"
                      >
                        Acompanhamento dos alunos
                      </h2>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex min-h-12 min-w-0 flex-1 basis-64 items-center gap-2 rounded-xl border border-(--line) bg-white px-4 focus-within:ring-2 focus-within:ring-(--focus)">
                          <Search size={17} aria-hidden="true" />
                          <input
                            aria-label="Buscar aluno por nome ou RA"
                            type="search"
                            placeholder="Buscar por nome ou RA"
                            value={search}
                            onChange={(event) => {
                              setSearch(event.target.value);
                              setPage(0);
                            }}
                            className="min-w-0 w-full bg-transparent text-sm outline-none"
                          />
                        </label>
                        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={attentionOnly}
                            onChange={(event) => {
                              setAttentionOnly(event.target.checked);
                              setPage(0);
                            }}
                            className="h-4 w-4 accent-(--blue-dark)"
                          />
                          Somente com pendências vencidas
                        </label>
                      </div>
                      {!filteredStudents.length ? (
                        <EmptyState
                          icon={Search}
                          title="Nenhum aluno encontrado com estes filtros."
                        />
                      ) : (
                        <>
                          <div className="overflow-x-auto rounded-2xl border border-(--line) bg-white">
                            <table className="w-full min-w-[650px] text-left text-sm">
                              <thead className="bg-slate-50 text-xs text-(--muted)">
                                <tr>
                                  {[
                                    "Aluno",
                                    "Média / 10",
                                    "Entregas",
                                    "Participação",
                                    "Pendências vencidas",
                                  ].map((label) => (
                                    <th
                                      scope="col"
                                      key={label}
                                      className="px-5 py-3 font-medium"
                                    >
                                      {label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--line)">
                                {filteredStudents
                                  .slice(current * 15, current * 15 + 15)
                                  .map((student) => {
                                    const summary = reportMetrics([student]);
                                    return (
                                      <tr
                                        key={student.id}
                                        className="hover:bg-slate-50"
                                      >
                                        <th
                                          scope="row"
                                          className="max-w-72 break-words px-5 py-4 font-medium"
                                        >
                                          {student.name}
                                          <span className="mt-1 block text-xs font-normal text-(--muted)">
                                            RA: {student.ra}
                                          </span>
                                        </th>
                                        <td className="px-5 py-4 tabular-nums">
                                          {number(summary.average)}
                                        </td>
                                        <td className="px-5 py-4 tabular-nums">
                                          {student.submitted} /{" "}
                                          {student.assigned}
                                        </td>
                                        <td className="px-5 py-4">
                                          <Completion
                                            value={summary.completion}
                                          />
                                        </td>
                                        <td
                                          className={`px-5 py-4 tabular-nums ${student.overdue ? "font-medium text-amber-800" : "text-(--muted)"}`}
                                        >
                                          {student.overdue
                                            ? `${student.overdue} sem entrega`
                                            : "Nenhuma"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                            <p role="status" className="text-(--muted)">
                              {filteredStudents.length} alunos · Página{" "}
                              {current + 1} de {pages}
                            </p>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                disabled={current === 0}
                                onClick={() => setPage(current - 1)}
                                className="min-h-11 rounded-lg border border-(--line) bg-white px-4 disabled:opacity-40"
                              >
                                Anterior
                              </button>
                              <button
                                type="button"
                                disabled={current + 1 >= pages}
                                onClick={() => setPage(current + 1)}
                                className="min-h-11 rounded-lg border border-(--line) bg-white px-4 disabled:opacity-40"
                              >
                                Próxima
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

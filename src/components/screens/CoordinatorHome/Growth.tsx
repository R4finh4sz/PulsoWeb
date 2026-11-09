"use client";

import { panelClass } from "@/components/screens/AdminDashboard";
import {
  ErrorMessage,
  actionClass,
  fieldClass,
} from "@/components/screens/Integration/shared";
import { metricsApi } from "@/integrations/metrics/api";
import { months } from "@/utils/months";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function CoordinatorGrowth() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [cumulative, setCumulative] = useState(false);
  const validYear = Number.isInteger(year) && year >= 1 && year <= 9999;
  const query = useQuery({
    queryKey: ["school-growth", year],
    queryFn: ({ signal }) => metricsApi.growth(year, signal),
    enabled: validYear,
  });
  const data = query.data;
  const series =
    data?.months.map((item) => ({
      month: item.month,
      students: cumulative ? item.cumulativeStudents : item.students,
      teachers: cumulative ? item.cumulativeTeachers : item.teachers,
    })) ?? [];
  const step = Math.max(
    1,
    Math.ceil(
      Math.max(0, ...series.flatMap((item) => [item.students, item.teachers])) /
        4,
    ),
  );
  const maximum = step * 4;
  return (
    <section
      aria-labelledby="growth-title"
      className={`${panelClass} space-y-5`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="growth-title" className="text-xl font-semibold">
            Crescimento de cadastros
          </h2>
          <p className="mt-2 text-sm text-(--muted)">
            {cumulative
              ? "Cadastros acumulados dentro do ano selecionado."
              : "Novos cadastros de alunos e professores por mês."}
          </p>
        </div>
        <label className="text-sm font-medium">
          Ano
          <input
            className={`${fieldClass} max-w-32`}
            type="number"
            min={1}
            max={9999}
            required
            value={year || ""}
            onChange={(event) => setYear(Number(event.target.value))}
          />
        </label>
      </div>
      <div
        role="group"
        aria-label="Visualização do crescimento"
        className="flex flex-wrap gap-2"
      >
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={cumulative === value}
            onClick={() => setCumulative(value)}
            className={`min-h-11 rounded-lg border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-cyan-700 ${cumulative === value ? "border-cyan-700 bg-cyan-50 text-cyan-900" : "border-(--line) hover:bg-slate-50"}`}
          >
            {value ? "Acumulado no ano" : "Por mês"}
          </button>
        ))}
      </div>
      {!validYear && <p role="alert">Informe um ano entre 1 e 9999.</p>}
      {validYear && (
        <>
          {query.isPending && <p role="status">Carregando crescimento…</p>}
          <ErrorMessage error={query.error} />
          {query.isError && (
            <button
              className={actionClass}
              onClick={() => void query.refetch()}
            >
              Tentar novamente
            </button>
          )}
          {data && !query.isError && (
            <>
              <div className="flex flex-wrap gap-5 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-sm bg-cyan-700"
                  />
                  Alunos
                </span>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-sm bg-amber-700"
                  />
                  Professores
                </span>
              </div>
              <div className="overflow-x-auto">
                <svg
                  viewBox="0 0 780 290"
                  role="img"
                  aria-label={`Cadastros ${cumulative ? "acumulados" : "mensais"} em ${data.year}. Valores mensais disponíveis na tabela acessível.`}
                  className="min-w-[640px] w-full"
                >
                  {[0, 1, 2, 3, 4].map((tick) => (
                    <g key={tick}>
                      <line
                        x1={55}
                        x2={765}
                        y1={245 - tick * 55}
                        y2={245 - tick * 55}
                        stroke="#e2e8f0"
                      />
                      <text
                        x={45}
                        y={249 - tick * 55}
                        textAnchor="end"
                        fontSize={12}
                        fill="#475569"
                      >
                        {(step * tick).toLocaleString("pt-BR")}
                      </text>
                    </g>
                  ))}
                  {series.map((item) => {
                    const x = 65 + (item.month - 1) * 58;
                    return (
                      <g key={item.month}>
                        <title>
                          {months[item.month - 1]}: {item.students} alunos,{" "}
                          {item.teachers} professores
                        </title>
                        <rect
                          x={x}
                          y={245 - (item.students / maximum) * 220}
                          width={17}
                          height={(item.students / maximum) * 220}
                          fill="#0e7490"
                          rx={2}
                        />
                        <rect
                          x={x + 20}
                          y={245 - (item.teachers / maximum) * 220}
                          width={17}
                          height={(item.teachers / maximum) * 220}
                          fill="#b45309"
                          rx={2}
                        />
                        <text
                          x={x + 18}
                          y={269}
                          textAnchor="middle"
                          fontSize={12}
                          fill="#475569"
                        >
                          {months[item.month - 1]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              {!series.some((item) => item.students || item.teachers) && (
                <p role="status" className="text-sm text-(--muted)">
                  Nenhum cadastro com data registrada neste ano.
                </p>
              )}
              <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
                <div>
                  <dt className="text-(--muted)">Média mensal de alunos</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">
                    {data.averageMonthlyStudents.toLocaleString("pt-BR", {
                      maximumFractionDigits: 2,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-(--muted)">
                    Média mensal de professores
                  </dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">
                    {data.averageMonthlyTeachers.toLocaleString("pt-BR", {
                      maximumFractionDigits: 2,
                    })}
                  </dd>
                </div>
              </dl>
              <div className="sr-only">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Cadastros {cumulative ? "acumulados no ano" : "por mês"} de{" "}
                    {data.year}
                  </caption>
                  <thead>
                    <tr>
                      {["Mês", "Alunos", "Professores"].map((label) => (
                        <th
                          key={label}
                          scope="col"
                          className="border-b border-(--line) px-3 py-3"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((item) => (
                      <tr key={item.month}>
                        <th scope="row" className="px-3 py-2 font-medium">
                          {months[item.month - 1]}
                        </th>
                        <td className="px-3 py-2 tabular-nums">
                          {item.students.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {item.teachers.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

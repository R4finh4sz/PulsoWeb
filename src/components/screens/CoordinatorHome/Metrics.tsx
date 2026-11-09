"use client";

import { Metric } from "@/components/screens/AdminDashboard";
import {
  ErrorMessage,
  actionClass,
} from "@/components/screens/Integration/shared";
import { metricsApi } from "@/integrations/metrics/api";
import { useQuery } from "@tanstack/react-query";

export function CoordinatorMetrics() {
  const query = useQuery({
    queryKey: ["school-metrics"],
    queryFn: ({ signal }) => metricsApi.school(signal),
  });
  const data = query.data;
  const numbers = data?.bigNumbers;
  const totals = numbers
    ? [
        { label: "Alunos", value: numbers.students, icon: "users" as const },
        {
          label: "Professores",
          value: numbers.teachers,
          icon: "users" as const,
        },
        { label: "Turmas", value: numbers.classrooms, icon: "school" as const },
        {
          label: "Disciplinas",
          value: numbers.subjects,
          icon: "school" as const,
        },
        {
          label: "Atividades",
          value: numbers.activities,
          icon: "chart" as const,
        },
        {
          label: "Entregas",
          value: numbers.submissions,
          icon: "check" as const,
        },
      ]
    : [];
  return (
    <section aria-label="Indicadores da escola" className="space-y-5">
      <h2 className="text-xl font-semibold">
        Visão geral{data ? ` · ${data.schoolName}` : ""}
      </h2>
      {query.isPending && <p role="status">Carregando indicadores…</p>}
      <ErrorMessage error={query.error} />
      {query.isError && (
        <button className={actionClass} onClick={() => void query.refetch()}>
          Tentar novamente
        </button>
      )}
      {data && !query.isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {totals.map((item) => (
              <Metric
                key={item.label}
                {...item}
                value={item.value.toLocaleString("pt-BR")}
                detail="Total na escola ativa"
                tone="bg-cyan-50 text-cyan-800"
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

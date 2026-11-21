"use client";

import { ErrorMessage, actionClass, fieldClass } from "@/components/screens/Integration/shared";
import { metricsApi } from "@/integrations/metrics/api";
import { CChart } from "@coreui/react-chartjs";
import { useQuery } from "@tanstack/react-query";

const roles = [
  ["STUDENT", "Alunos"],
  ["TEACHER", "Professores"],
  ["PEDAGOGICAL_COORDINATOR", "Coordenadores"],
  ["ADMIN", "Administradores"],
] as const;

function UsageChart({
  title,
  entries,
}: {
  title: string;
  entries: { label: string; count: number }[];
}) {
  return (
    <section className="card min-w-0">
      <h3 className="card-header text-base font-semibold">{title}</h3>
      <div className="card-body">
        {entries.length === 0 ? (
          <p className="text-sm text-(--muted)">Nenhuma solicitação no período.</p>
        ) : (
          <>
            <div style={{ height: Math.max(180, entries.length * 26 + 35) }}>
              <CChart
                type="bar"
                customTooltips={false}
                aria-hidden="true"
                data={{
                  labels: entries.map(({ label }) => label),
                  datasets: [{
                    data: entries.map(({ count }) => count),
                    backgroundColor: "#087d99",
                  }],
                }}
                options={{
                  indexAxis: "y",
                  maintainAspectRatio: false,
                  animation: false,
                  locale: "pt-BR",
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
                }}
              />
            </div>
            <dl className="sr-only">
              {entries.map(({ label, count }, index) => (
                <div key={index}>
                  <dt>{label}</dt>
                  <dd>{count.toLocaleString("pt-BR")}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </section>
  );
}

export function UsageMetrics({
  month,
  onMonthChange,
}: {
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const validMonth = month === "" || /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(month);
  const query = useQuery({
    queryKey: ["admin-usage-metrics", month],
    queryFn: ({ signal }) => metricsApi.adminUsage(month, signal),
    enabled: validMonth,
  });
  const data = query.data;

  return (
    <section aria-labelledby="usage-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="usage-title" className="text-xl font-semibold">Uso da plataforma</h2>
          <p className="text-sm text-(--muted)">
            {month ? "Cadastros e solicitações do mês selecionado." : "Usuários atuais e histórico de solicitações."}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-sm font-medium">
            Filtrar por mês
            <input
              className={fieldClass}
              type="month"
              min="0001-01"
              max="9999-12"
              value={month}
              aria-invalid={!validMonth}
              onChange={(event) => onMonthChange(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={actionClass}
            disabled={!month}
            onClick={() => onMonthChange("")}
          >
            Limpar filtro
          </button>
        </div>
      </div>
      {!validMonth && <p role="alert">Informe um mês no formato AAAA-MM.</p>}
      {validMonth && query.isPending && <p role="status">Carregando métricas de uso…</p>}
      <ErrorMessage error={query.error} />
      {query.isError && (
        <button type="button" className={actionClass} onClick={() => void query.refetch()}>
          Tentar carregar métricas de uso novamente
        </button>
      )}
      {data && (
        <>
          <p className="card">
            <span className="card-body block text-sm">
              {data.month ? "Novos usuários no mês" : "Total de usuários"}
              <strong className="mt-1 block text-2xl tabular-nums">
                {data.totalUsers.toLocaleString("pt-BR")}
              </strong>
            </span>
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <UsageChart
              title="Usuários por perfil"
              entries={roles.map(([role, label]) => ({ label, count: data.usersByRole[role] }))}
            />
            <UsageChart
              title="Solicitações de acesso por estado"
              entries={data.demandByState.map(({ state, requests }) => ({
                label: state || "UF não informada",
                count: requests,
              }))}
            />
          </div>
        </>
      )}
    </section>
  );
}

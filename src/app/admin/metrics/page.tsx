"use client";

import {
  ErrorMessage,
  Protected,
  Workspace,
  actionClass,
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import { metricsApi } from "@/integrations/metrics/api";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { HistoryDoughnuts, MetricsCharts } from "./Charts";
import { UsageMetrics } from "./UsageMetrics";
import "./metrics.scss";

const format = (value: number | null) =>
  value === null
    ? "Indisponível"
    : value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const memory = (value: number | null) =>
  value === null ? "Indisponível" : `${format(value / 1024 / 1024)} MiB`;
const time = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString("pt-BR");

const views = [
  { id: "system", label: "Sistema" },
  { id: "leads", label: "Leads" },
] as const;

function AdminMetrics() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("system");
  const [month, setMonth] = useState("");

  return (
    <section
      aria-label="Indicadores da plataforma"
      className="adminMetrics space-y-5"
    >
      <BackLink />
      <div role="group" aria-label="Tipo de métrica" className="flex flex-wrap gap-2">
        {views.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
            className={`min-h-11 rounded-lg border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-cyan-700 ${view === id ? "border-cyan-700 bg-cyan-50 text-cyan-900" : "border-(--line) hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "system" ? <SystemMetrics /> : <UsageMetrics month={month} onMonthChange={setMonth} />}
    </section>
  );
}

function SystemMetrics() {
  const query = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: ({ signal }) => metricsApi.admin(signal),
    refetchInterval: 15_000,
  });
  const current = query.data?.current;

  return (
    <section aria-label="Métricas do sistema" className="space-y-5">
      {query.isPending && <p role="status">Carregando indicadores…</p>}
      <ErrorMessage error={query.error} />
      {query.isError && (
        <button className={actionClass} onClick={() => void query.refetch()}>
          Tentar novamente
        </button>
      )}
      {query.isSuccess && !current && (
        <p role="status">
          Aguardando a primeira amostra do servidor. Os indicadores são
          coletados a cada 15 segundos.
        </p>
      )}
      {current && (
        <>
          <p className="text-sm text-(--muted)">
            Última amostra: {time(current.timestamp)} · Atualização automática a
            cada 15 segundos.
            {query.isError ? " Exibindo a última amostra recebida." : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Requisições por segundo",
                value: format(current.requestsPerSecond),
              },
              {
                label: "Erros HTTP 5xx",
                value: `${format(current.http5xxPercent)}%`,
              },
              {
                label: "Tempo médio de resposta",
                value: `${format(current.averageResponseMs)} ms`,
              },
              {
                label: "CPU do processo",
                value:
                  current.processCpuPercent === null
                    ? "Indisponível"
                    : `${format(current.processCpuPercent)}%`,
              },
            ].map(({ label, value }) => (
              <article key={label} className="card">
                <div className="card-body">
                  <h2 className="text-sm font-medium text-(--muted)">
                    {label}
                  </h2>
                  <p className="mt-3 text-2xl font-semibold tabular-nums">
                    {value}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <MetricsCharts history={query.data?.history ?? []} />
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <section className="card">
              <h2 className="card-header text-base font-semibold">
                Recursos do servidor
              </h2>
              <dl className="card-body space-y-4 text-sm">
                {[
                  [
                    "Tempo em execução",
                    `${format(current.uptimeSeconds / 3600)} h`,
                  ],
                  ["Memória heap utilizada", memory(current.heapUsedBytes)],
                  [
                    "Memória heap reservada",
                    memory(current.heapCommittedBytes),
                  ],
                  ["Threads ativas", format(current.liveThreads)],
                  [
                    "Conexões ativas no banco",
                    format(current.databaseActiveConnections),
                  ],
                  [
                    "Conexões ociosas no banco",
                    format(current.databaseIdleConnections),
                  ],
                  [
                    "Intervalo da amostra",
                    `${format(current.intervalSeconds)} s`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt className="text-(--muted)">{label}</dt>
                    <dd className="font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="card">
              <h2 className="card-header text-base font-semibold">
                Requisições por status HTTP
              </h2>
              <div className="card-body">
                {Object.keys(current.requestsPerSecondByStatus).length === 0 ? (
                  <p className="text-sm text-(--muted)">
                    Nenhuma requisição registrada no intervalo.
                  </p>
                ) : (
                  <table className="table mb-0 text-sm tabular-nums">
                    <caption className="sr-only">
                      Taxa atual de requisições por status HTTP
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Status</th>
                        <th scope="col">Requisições/s</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(current.requestsPerSecondByStatus)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([status, rate]) => (
                          <tr key={status}>
                            <th scope="row">{status}</th>
                            <td>{format(rate)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
          <section className="card">
            <h2 className="card-header text-base font-semibold">
              Histórico da instância · última hora
            </h2>
            <div className="card-body">
              <p className="mb-4 text-sm text-(--muted)">
                As amostras são mantidas em memória e reiniciam com o servidor.
              </p>
              <HistoryDoughnuts history={query.data?.history ?? []} />
              <details className="group mt-6 border-t border-(--line) pt-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-(--blue-dark) [&::-webkit-details-marker]:hidden">
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 -rotate-90 group-open:rotate-0"
                  />
                  Ver amostras
                </summary>
                <div
                  className="table-responsive max-h-96 overflow-auto"
                  tabIndex={0}
                  role="region"
                  aria-label="Histórico de métricas"
                >
                  <table className="table table-hover mb-0 whitespace-nowrap text-center text-sm tabular-nums">
                    <caption className="sr-only">
                      Histórico de requisições, erros, latência e CPU, do mais
                      recente ao mais antigo
                    </caption>
                    <thead>
                      <tr>
                        {[
                          "Horário",
                          "Requisições/s",
                          "Erros 5xx",
                          "Resposta média",
                          "CPU",
                        ].map((label) => (
                          <th scope="col" key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...(query.data?.history ?? [])]
                        .reverse()
                        .map((sample) => (
                          <tr key={sample.timestamp}>
                            <th scope="row">{time(sample.timestamp)}</th>
                            <td>{format(sample.requestsPerSecond)}</td>
                            <td>{format(sample.http5xxPercent)}%</td>
                            <td>{format(sample.averageResponseMs)} ms</td>
                            <td>
                              {sample.processCpuPercent === null
                                ? "Indisponível"
                                : `${format(sample.processCpuPercent)}%`}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default function Page() {
  return (
    <Protected role="admin">
      {(user) => (
        <Workspace
          user={user}
          title="Métricas"
          description="Acompanhe os cadastros, as solicitações de acesso e o desempenho do servidor."
        >
          <AdminMetrics />
        </Workspace>
      )}
    </Protected>
  );
}

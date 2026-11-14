"use client";

import { CChart } from "@coreui/react-chartjs";
import type { TechnicalSample } from "@/integrations/metrics/api";

const charts = [
  {
    title: "Tráfego de requisições",
    field: "requestsPerSecond",
    unit: "req/s",
    color: "#087d99",
    type: "line",
  },
  {
    title: "Tempo de resposta",
    field: "averageResponseMs",
    unit: "ms",
    color: "#7060bd",
    type: "line",
  },
  {
    title: "Erros do servidor",
    field: "http5xxPercent",
    unit: "%",
    color: "#b64739",
    type: "bar",
  },
  {
    title: "Uso de CPU",
    field: "processCpuPercent",
    unit: "%",
    color: "#287958",
    type: "line",
  },
] as const;

export function HistoryDoughnuts({ history }: { history: TechnicalSample[] }) {
  const statuses: Record<string, number> = {};
  let cpuTotal = 0;
  let cpuSeconds = 0;
  for (const sample of history) {
    for (const [status, rate] of Object.entries(
      sample.requestsPerSecondByStatus,
    )) {
      statuses[status] =
        (statuses[status] ?? 0) + rate * sample.intervalSeconds;
    }
    if (sample.processCpuPercent !== null) {
      cpuTotal += sample.processCpuPercent * sample.intervalSeconds;
      cpuSeconds += sample.intervalSeconds;
    }
  }
  const requests = Object.entries(statuses)
    .filter(([, total]) => total > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const totalRequests = requests.reduce((sum, [, total]) => sum + total, 0);
  const cpu = cpuSeconds > 0 ? cpuTotal / cpuSeconds : null;
  const summaries = [
    {
      title: "Requisições por status HTTP",
      labels: requests.map(([status]) => `HTTP ${status}`),
      values: requests.map(([, total]) => (total / totalRequests) * 100),
      colors: requests.map(([status]) =>
        status.startsWith("5")
          ? "#b64739"
          : status.startsWith("4")
            ? "#a16a14"
            : status.startsWith("3")
              ? "#7060bd"
              : "#087d99",
      ),
      empty: "Nenhuma requisição registrada no histórico.",
    },
    {
      title: "Uso médio de CPU do processo",
      labels: ["CPU utilizada", "Capacidade restante"],
      values: cpu === null ? [] : [cpu, 100 - cpu],
      colors: ["#287958", "#e6edef"],
      empty: "CPU indisponível no histórico.",
    },
  ];

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      {summaries.map(({ title, labels, values, colors, empty }) => (
        <section key={title} className="min-w-0">
          <h3 className="mb-4 text-center text-sm font-medium">{title}</h3>
          {values.length === 0 ? (
            <p className="py-12 text-center text-sm text-(--muted)">{empty}</p>
          ) : (
            <>
              <div className="relative mx-auto h-60 max-w-80">
                <CChart
                  type="doughnut"
                  customTooltips={false}
                  role="img"
                  aria-label={`${title}. Percentuais detalhados abaixo.`}
                  data={{
                    labels,
                    datasets: [
                      {
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: "#ffffff",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    locale: "pt-BR",
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            `${context.label}: ${Number(context.raw).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`,
                        },
                      },
                    },
                  }}
                />
              </div>
              <dl className="mx-auto mt-4 max-w-80 space-y-2 text-sm">
                {labels.map((label, index) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt>{label}</dt>
                    <dd className="font-medium tabular-nums">
                      {values[index].toLocaleString("pt-BR", {
                        maximumFractionDigits: 2,
                      })}
                      %
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>
      ))}
    </div>
  );
}

export function MetricsCharts({ history }: { history: TechnicalSample[] }) {
  if (history.length === 0)
    return (
      <p className="text-sm text-(--muted)">
        Aguardando histórico para exibir os gráficos.
      </p>
    );

  const samples = [...history].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
  const labels = samples.map((sample) =>
    new Date(sample.timestamp).toLocaleTimeString("pt-BR"),
  );

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      {charts.map(({ title, field, unit, color, type }) => (
        <section key={field} className="card min-w-0">
          <div className="card-body">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mb-5 mt-1 text-xs text-(--muted)">
              Última hora · {unit}
            </p>
            {samples.every((sample) => sample[field] === null) ? (
              <p className="flex h-64 items-center justify-center text-sm text-(--muted)">
                Indicador indisponível nas amostras recebidas.
              </p>
            ) : (
              <div className="relative h-64 min-w-0 sm:h-72">
                <CChart
                  type={type}
                  customTooltips={false}
                  role="img"
                  aria-label={`${title} na última hora, em ${unit}. Valores disponíveis na tabela de histórico abaixo.`}
                  data={{
                    labels,
                    datasets: [
                      {
                        label: `${title} (${unit})`,
                        data: samples.map((sample) => sample[field]),
                        borderColor: color,
                        backgroundColor: `${color}20`,
                        borderWidth: 2,
                        fill: type === "line",
                        pointRadius: samples.length === 1 ? 4 : 0,
                        pointHitRadius: 12,
                        spanGaps: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    locale: "pt-BR",
                    interaction: { mode: "index", intersect: false },
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          maxTicksLimit: 6,
                          maxRotation: 0,
                          color: "#60737d",
                        },
                      },
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: unit },
                        ticks: { color: "#60737d" },
                        grid: { color: "#e6edef" },
                        ...(unit === "%" ? { max: 100 } : {}),
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

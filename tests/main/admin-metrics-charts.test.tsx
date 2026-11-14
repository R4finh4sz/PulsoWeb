import { HistoryDoughnuts, MetricsCharts } from "@/app/admin/metrics/Charts";
import type { TechnicalSample } from "@/integrations/metrics/api";
import { CChart } from "@coreui/react-chartjs";
import { render, screen } from "@testing-library/react";

jest.mock("@coreui/react-chartjs", () => ({
  CChart: jest.fn(({ "aria-label": label }: { "aria-label"?: string }) => (
    <canvas role="img" aria-label={label} />
  )),
}));

const sample: TechnicalSample = {
  timestamp: "2026-11-08T12:00:00Z",
  uptimeSeconds: 60,
  intervalSeconds: 15,
  requestsPerSecond: 0,
  http5xxPercent: 0,
  averageResponseMs: 0,
  requestsPerSecondByStatus: {},
  processCpuPercent: null,
  heapUsedBytes: null,
  heapCommittedBytes: null,
  liveThreads: null,
  databaseActiveConnections: null,
  databaseIdleConnections: null,
};

test("gráficos ordenam histórico, preservam zero e lacunas e não alteram os dados", () => {
  const history = [
    {
      ...sample,
      timestamp: "2026-11-08T12:00:15Z",
      requestsPerSecond: 8,
      processCpuPercent: 25,
    },
    sample,
  ];
  render(<MetricsCharts history={history} />);
  expect(screen.getAllByRole("img")).toHaveLength(4);
  const props = jest.mocked(CChart).mock.calls.map(([props]) => props);
  expect(props[0]).toMatchObject({
    type: "line",
    options: { animation: false },
    data: { datasets: [{ data: [0, 8] }] },
  });
  expect(props[2]).toMatchObject({
    type: "bar",
    data: { datasets: [{ data: [0, 0] }] },
  });
  expect(props[3]).toMatchObject({
    data: { datasets: [{ data: [null, 25], spanGaps: false }] },
  });
  expect(history[0].requestsPerSecond).toBe(8);
});

test("gráficos mostram espera sem histórico", () => {
  render(<MetricsCharts history={[]} />);
  expect(screen.getByText(/Aguardando histórico/)).toBeVisible();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

test("CPU indisponível não vira uma linha em zero", () => {
  render(<MetricsCharts history={[sample]} />);
  expect(screen.getAllByRole("img")).toHaveLength(3);
  expect(
    screen.getByText("Indicador indisponível nas amostras recebidas."),
  ).toBeVisible();
});

test("roscas ponderam as taxas e a CPU pela duração de cada amostra", () => {
  render(
    <HistoryDoughnuts
      history={[
        {
          ...sample,
          intervalSeconds: 10,
          requestsPerSecondByStatus: { "200": 2 },
          processCpuPercent: 20,
        },
        {
          ...sample,
          intervalSeconds: 30,
          requestsPerSecondByStatus: { "500": 2 },
          processCpuPercent: 60,
        },
        { ...sample, intervalSeconds: 20 },
      ]}
    />,
  );
  const props = jest.mocked(CChart).mock.calls.map(([props]) => props);
  expect(props[0]).toMatchObject({
    type: "doughnut",
    data: { labels: ["HTTP 200", "HTTP 500"], datasets: [{ data: [25, 75] }] },
  });
  expect(props[1]).toMatchObject({
    type: "doughnut",
    data: { datasets: [{ data: [50, 50] }] },
  });
  expect(screen.getByText("25%")).toBeVisible();
});

test("roscas não inventam percentuais sem tráfego ou CPU", () => {
  render(<HistoryDoughnuts history={[sample]} />);
  expect(
    screen.getByText("Nenhuma requisição registrada no histórico."),
  ).toBeVisible();
  expect(screen.getByText("CPU indisponível no histórico.")).toBeVisible();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

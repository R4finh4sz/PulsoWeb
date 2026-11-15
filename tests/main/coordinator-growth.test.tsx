import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { CoordinatorGrowth } from "@/components/screens/CoordinatorHome/Growth";
import { metricsApi, type SchoolGrowth } from "@/integrations/metrics/api";
import { queryWrapper } from "../helpers";

jest.mock("@/integrations/metrics/api", () => ({
  metricsApi: { growth: jest.fn() },
}));
const data: SchoolGrowth = {
  schoolId: 1,
  schoolName: "Escola",
  year: 2026,
  months: Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    students: index === 0 ? 2 : 0,
    teachers: index === 1 ? 1 : 0,
    cumulativeStudents: 2,
    cumulativeTeachers: index === 0 ? 0 : 1,
  })),
  averageMonthlyStudents: 0.17,
  averageMonthlyTeachers: 0.08,
  studentsWithoutRegistrationDate: 10,
  teachersWithoutRegistrationDate: 3,
};
beforeEach(() =>
  jest.mocked(metricsApi.growth).mockReset().mockResolvedValue(data),
);

test("mostra gráfico e médias sem aviso ou expansor; alterna valores mensais e acumulados", async () => {
  render(<CoordinatorGrowth />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("img")).toHaveAccessibleName(
    /Cadastros mensais em 2026/,
  );
  expect(screen.getByText("0,17")).toBeVisible();
  expect(screen.queryByText(/Fora do gráfico/)).not.toBeInTheDocument();
  expect(screen.queryByText("Ver valores por mês")).not.toBeInTheDocument();
  const february = screen.getByRole("row", { name: "Fev 0 1" });
  expect(
    within(february)
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  ).toEqual(["0", "1"]);
  fireEvent.click(screen.getByRole("button", { name: "Acumulado no ano" }));
  expect(screen.getByRole("row", { name: "Fev 2 1" })).toBeVisible();
  fireEvent.change(screen.getByRole("spinbutton", { name: "Ano" }), {
    target: { value: "2025" },
  });
  await waitFor(() =>
    expect(metricsApi.growth).toHaveBeenLastCalledWith(
      2025,
      expect.any(AbortSignal),
    ),
  );
});

test("ano inválido não dispara consulta e zero não gera escala inválida", async () => {
  jest
    .mocked(metricsApi.growth)
    .mockResolvedValue({
      ...data,
      months: data.months.map((month) => ({
        ...month,
        students: 0,
        teachers: 0,
        cumulativeStudents: 0,
        cumulativeTeachers: 0,
      })),
    });
  render(<CoordinatorGrowth />, { wrapper: queryWrapper().wrapper });
  expect(
    await screen.findByText("Nenhum cadastro com data registrada neste ano."),
  ).toBeVisible();
  expect(screen.getByRole("img").outerHTML).not.toMatch(/NaN|Infinity/);
  const calls = jest.mocked(metricsApi.growth).mock.calls.length;
  fireEvent.change(screen.getByRole("spinbutton", { name: "Ano" }), {
    target: { value: "0" },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("Informe um ano");
  expect(metricsApi.growth).toHaveBeenCalledTimes(calls);
});

test.each([[2, 2, 4], [100, 100, 200], [1250, 1252, 2500]])("ajusta a escala aos valores reais: %i cadastros", async (count, maximum, cumulativeMaximum) => {
  jest.mocked(metricsApi.growth).mockResolvedValue({
    ...data,
    months: [{ month: 1, students: count, teachers: 1, cumulativeStudents: count * 2, cumulativeTeachers: 1 }],
  });
  render(<CoordinatorGrowth />, { wrapper: queryWrapper().wrapper });
  const chart = await screen.findByRole("img");
  const axisValues = () => Array.from(chart.querySelectorAll('text[text-anchor="end"]')).map((tick) => tick.textContent);
  expect(axisValues().at(-1)).toBe(maximum.toLocaleString("pt-BR"));
  expect(chart.querySelector("rect")).toHaveAttribute("height", String(count / maximum * 220));
  fireEvent.click(screen.getByRole("button", { name: "Acumulado no ano" }));
  expect(axisValues().at(-1)).toBe(cumulativeMaximum.toLocaleString("pt-BR"));
});

test("erro permite tentar novamente", async () => {
  jest
    .mocked(metricsApi.growth)
    .mockRejectedValueOnce(new Error("Serviço indisponível"));
  render(<CoordinatorGrowth />, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Serviço indisponível",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("img")).toBeVisible();
});

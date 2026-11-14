import { apiRequest } from "@/api/client";
import { metricsApi } from "@/integrations/metrics/api";

jest.mock("@/api/client", () => ({ apiRequest: jest.fn() }));

test("métricas técnicas usam a rota do admin e encaminham cancelamento", async () => {
  const signal = new AbortController().signal;
  const response = { current: null, history: [] };
  jest.mocked(apiRequest).mockResolvedValue(response);
  expect(await metricsApi.admin(signal)).toEqual(response);
  expect(apiRequest).toHaveBeenCalledWith("/admin/metrics", { signal });
});

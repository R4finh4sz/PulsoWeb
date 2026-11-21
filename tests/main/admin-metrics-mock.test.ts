import type { TechnicalMetrics } from "@/integrations/metrics/api";
import { mockRequest } from "@/mocks/api";

test("the admin demo has a rolling hour of technical samples on the first request", () => {
  const now = jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-21T15:00:00Z"));
  try {
    const readMetrics = () =>
      mockRequest("/admin/metrics", "GET", undefined, "pulso-mock:1") as TechnicalMetrics;
    const first = readMetrics();
    expect(first.history).toHaveLength(240);
    expect(first.current).toEqual(first.history[239]);
    expect(first.history[0].timestamp).toBe("2026-11-21T14:00:15.000Z");
    expect(first.current?.requestsPerSecond).toBeGreaterThan(0);

    now.mockReturnValue(Date.parse("2026-11-21T15:00:15Z"));
    const next = readMetrics();
    expect(next.history[238].timestamp).toBe(first.current?.timestamp);
    expect(next.current?.timestamp).toBe("2026-11-21T15:00:15.000Z");
  } finally {
    now.mockRestore();
  }
});

jest.mock("@/mocks/access", () => ({
  ...jest.requireActual("@/mocks/access"),
  mockAccessEnabled: true,
}));
import { reportsApi } from "@/integrations/reports/api";
import { useAuthState } from "@/integrations/auth/state";
import { createDemoSession, demoUsers } from "@/mocks/access";

afterEach(() => useAuthState.getState().setSession(null));
test("relatório demonstrativo usa o mesmo contrato e respeita filtros", async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  const all = await reportsApi.get();
  expect(all.summary.classroomCount).toBe(all.classrooms.length);
  expect(all.summary.recipientHistoryComplete).toBe(true);
  expect(all.summary.submittedCount).toBeLessThanOrEqual(
    all.summary.expectedSubmissions!,
  );
  const selected = all.classrooms[0];
  const filtered = await reportsApi.get({
    classroomId: selected.classroomId,
    status: "FINISHED",
  });
  expect(
    filtered.classrooms.every(
      (room) => room.classroomId === selected.classroomId,
    ),
  ).toBe(true);
  expect(filtered.summary.activityCount).toBeLessThanOrEqual(
    all.summary.activityCount,
  );
});

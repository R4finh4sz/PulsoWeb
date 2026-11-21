import type { StudentRanking } from "@/integrations/ranking/students";
import { mockRequest } from "@/mocks/api";

const ranking = (year: number, bimester: number, school = "") =>
  mockRequest(
    `/rankings/students?year=${year}&bimester=${bimester}${school}`,
    "GET",
    undefined,
    "pulso-mock:1",
  ) as StudentRanking[];

test("demo ranking has results for each bimester and filters by school", () => {
  const year = new Date().getFullYear();
  for (const periodYear of [year - 1, year]) {
    for (const bimester of [1, 2, 3, 4]) {
      expect(ranking(periodYear, bimester).length).toBeGreaterThan(0);
    }
  }

  const general = ranking(year, 4);
  const school = ranking(year, 4, "&schoolId=2");
  expect(school.length).toBeGreaterThan(0);
  expect(school.length).toBeLessThan(general.length);
  expect(school.every(({ studentId }) => studentId >= 1200 && studentId < 1300)).toBe(true);
  expect(school[0].position).toBe(1);
  expect(general.every((row, index) =>
    index === 0 || row.accuracyPercentage <= general[index - 1].accuracyPercentage,
  )).toBe(true);
  expect(ranking(year - 2, 4)).toEqual([]);
  expect(() => ranking(year, 5)).toThrow(/bimestre/);
});

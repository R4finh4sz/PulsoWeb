import { parseQuizDeadline, quizDateTime } from "@/utils/quizDeadline";

test.each([
  ["2027-01-01T02:30:00Z", "2026-12-31T23:30"],
  ["2027-01-01T03:30:00Z", "2027-01-01T00:30"],
  ["2026-11-13T15:00:00Z", "2026-11-13T12:00"],
])("prazo usa São Paulo e preserva o instante: %s", (instant, local) => {
  expect(quizDateTime(new Date(instant))).toBe(local);
  expect(parseQuizDeadline(local).toISOString()).toBe(instant.replace("Z", ".000Z"));
});

test.each(["", "inválido"])("prazo ausente ou inválido não lança erro: %s", (value) => {
  expect(Number.isNaN(parseQuizDeadline(value).getTime())).toBe(true);
});

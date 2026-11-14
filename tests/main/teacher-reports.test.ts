import type { QuizResults } from "@/integrations/quizzes/api";
import { buildClassroomReports, reportMetrics } from "@/utils/teacherReports";

function result(
  id: number,
  grade: number | null,
  status: "OPEN" | "CLOSED" = "OPEN",
  classroomId = 1,
): QuizResults {
  return {
    quiz: {
      id,
      classroomId,
      classroomName: `Turma ${classroomId}`,
      schoolName: "Escola",
      subjectName: "Matemática",
      subjectId: 1,
      teacherId: 3,
      status,
      closesAt: "2030-01-01T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      questions: [],
    },
    students: [
      {
        studentId: 4,
        name: "Ana",
        ra: "001",
        submittedAt: grade === null ? null : "2026-01-02T00:00:00Z",
        score:
          grade === null
            ? null
            : { grade, correct: grade, total: 10, themes: [], review: [] },
      },
    ],
  };
}

test("consolida atividades por aluno sem transformar ausências em nota zero", () => {
  const [report] = buildClassroomReports(
    [result(1, 8), result(2, null, "CLOSED"), result(3, null)],
    0,
  );
  expect(report.students).toHaveLength(1);
  expect(report.average).toBe(8);
  expect(report.completion).toBeCloseTo(100 / 3);
  expect(report.overdue).toBe(1);
  expect(report.attention).toBe(1);
  expect(report.assigned).toBe(3);
});

test("considera uma nota zero como entrega e distingue ausência de notas", () => {
  expect(buildClassroomReports([result(1, 0)], 0)[0]).toMatchObject({
    average: 0,
    completion: 100,
  });
  expect(buildClassroomReports([result(1, null)], 0)[0]).toMatchObject({
    average: null,
    completion: 0,
    overdue: 0,
  });
  expect(reportMetrics([])).toMatchObject({ average: null, completion: null });
});

test("pondera médias por entrega e participação pelo total previsto entre turmas", () => {
  const reports = buildClassroomReports(
    [
      result(1, 10),
      result(2, 10),
      result(3, 4, "OPEN", 2),
      result(4, null, "OPEN", 2),
    ],
    0,
  );
  const summary = reportMetrics(reports.flatMap((report) => report.students));
  expect(reports).toHaveLength(2);
  expect(summary.average).toBe(8);
  expect(summary.completion).toBe(75);
});

test("trata prazo vencido como pendência mesmo antes de atualizar o status", () => {
  expect(
    buildClassroomReports([result(1, null)], Date.parse("2031-01-01"))[0]
      .overdue,
  ).toBe(1);
});

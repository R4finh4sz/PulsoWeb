import type { QuizResults } from "@/integrations/quizzes/api";

export type ReportStudent = {
  id: number;
  name: string;
  ra: string;
  assigned: number;
  submitted: number;
  overdue: number;
  grades: number[];
};

export function reportMetrics(students: ReportStudent[]) {
  const grades = students.flatMap((student) => student.grades);
  const assigned = students.reduce((sum, student) => sum + student.assigned, 0);
  const submitted = students.reduce(
    (sum, student) => sum + student.submitted,
    0,
  );
  return {
    average: grades.length
      ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length
      : null,
    completion: assigned ? (submitted / assigned) * 100 : null,
    assigned,
    submitted,
    overdue: students.reduce((sum, student) => sum + student.overdue, 0),
    attention: students.filter((student) => student.overdue > 0).length,
  };
}

export function buildClassroomReports(
  results: QuizResults[],
  now = Date.now(),
) {
  const classrooms = new Map<
    number,
    {
      id: number;
      name: string;
      school: string;
      activities: number;
      students: Map<number, ReportStudent>;
    }
  >();
  for (const { quiz, students } of results) {
    const classroom = classrooms.get(quiz.classroomId) ?? {
      id: quiz.classroomId,
      name: quiz.classroomName,
      school: quiz.schoolName,
      activities: 0,
      students: new Map<number, ReportStudent>(),
    };
    classroom.activities++;
    for (const result of students) {
      const student = classroom.students.get(result.studentId) ?? {
        id: result.studentId,
        name: result.name,
        ra: result.ra,
        assigned: 0,
        submitted: 0,
        overdue: 0,
        grades: [],
      };
      student.assigned++;
      if (result.score !== null) {
        student.submitted++;
        student.grades.push(result.score.grade);
      } else if (quiz.status === "CLOSED" || Date.parse(quiz.closesAt) <= now) {
        student.overdue++;
      }
      classroom.students.set(student.id, student);
    }
    classrooms.set(classroom.id, classroom);
  }
  return [...classrooms.values()]
    .map((classroom) => {
      const students = [...classroom.students.values()].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      );
      return { ...classroom, students, ...reportMetrics(students) };
    })
    .sort(
      (a, b) =>
        a.school.localeCompare(b.school, "pt-BR") ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
}

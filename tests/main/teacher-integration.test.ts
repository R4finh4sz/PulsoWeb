import { apiRequest } from "@/api/client";
import { quizzesApi } from "@/integrations/quizzes/api";
import { schoolsApi } from "@/integrations/schools/api";
import { classroomsApi } from "@/integrations/classrooms/api";
import { useAuthState } from "@/integrations/auth/state";
import { session } from "../helpers";

jest.mock("@/api/client", () => ({ apiRequest: jest.fn() }));
const request = jest.mocked(apiRequest);
const signal = new AbortController().signal;
const activity = {
  id: 7,
  subjectId: 3,
  classroomId: 2,
  schoolId: 1,
  questionCount: 10,
  status: "FINISHED",
  createdAt: "2026-01-01T00:00:00Z",
  closesAt: "2026-01-02T00:00:00Z",
};
const question = {
  question: "Quanto é 1 + 1?",
  options: ["1", "2", "3", "4"],
  theme: "Soma",
  correctOption: 1,
};

beforeEach(() => {
  request.mockReset();
  useAuthState.getState().setSession({
    ...session,
    user: { ...session.user, role: "TEACHER", schoolId: 1 },
  });
  request.mockImplementation(async (path) => {
    if (path === "/me/profile")
      return {
        schools: [
          { id: "1", name: "Escola Central", city: "Santos", state: "SP" },
        ],
      };
    if (path === "/teacher/classrooms")
      return [
        {
          id: 2,
          name: "6º ano A",
          identifier: "A",
          teacherIds: [3],
          schoolId: 1,
          schoolName: "Escola Central",
        },
        {
          id: 8,
          name: "3º ano B",
          identifier: "B",
          teacherIds: [3],
          schoolId: 9,
          schoolName: "Escola Norte",
        },
      ];
    if (path === "/classrooms/2") return { id: 2, name: "6º ano A" };
    if (path === "/classrooms/2/subjects")
      return [
        {
          id: 3,
          name: "Matemática",
          teacherId: 4,
          topics: [{ title: "Soma" }],
        },
      ];
    if (path === "/classrooms/2/students")
      return [
        { id: 10, fullName: "Ana", ra: "001" },
        { id: 11, fullName: "Bia", ra: "002" },
      ];
    if (path === "/teacher/activities")
      return [
        {
          activity,
          submissions: [
            {
              studentId: 10,
              submittedAt: activity.createdAt,
              score: 0,
              correctAnswers: 0,
              questionCount: 10,
              themePerformance: [
                { theme: "Soma", questionCount: 10, incorrectAnswers: 10 },
              ],
            },
          ],
        },
      ];
    if (path === "/classrooms/2/subjects/3/activities") return [activity];
    if (path === "/activities/7/quiz")
      return { questions: [{ ...question, correctOption: undefined }] };
    if (path === "/subjects/3/activities")
      return { ...activity, status: "OPEN" };
    throw new Error(`Rota inesperada: ${path}`);
  });
});
afterEach(() => useAuthState.getState().setSession(null));

test("professor consulta escolas do perfil e preserva turmas de todas as escolas", async () => {
  expect(await schoolsApi.list(signal)).toEqual([
    expect.objectContaining({
      id: 1,
      nome: "Escola Central",
      cidade: "Santos",
    }),
  ]);
  expect(await classroomsApi.teacherList(signal)).toEqual([
    expect.objectContaining({
      id: 2,
      schoolId: 1,
      schoolName: "Escola Central",
    }),
    expect.objectContaining({ id: 8, schoolId: 9, schoolName: "Escola Norte" }),
  ]);
  expect(request).toHaveBeenCalledWith("/teacher/classrooms", { signal });
  expect(request).not.toHaveBeenCalledWith("/schools", expect.anything());
});

test("atividades adaptam status, contagem e nomes", async () => {
  expect(await quizzesApi.activities(signal)).toEqual([
    expect.objectContaining({
      id: 7,
      status: "CLOSED",
      questionCount: 10,
      subjectName: "Matemática",
      classroomName: "6º ano A",
      schoolName: "Escola Central",
    }),
  ]);
});

test("quizzes usam as rotas de atividades e não inventam gabarito", async () => {
  expect(await quizzesApi.list(2, 3, signal)).toEqual([
    expect.objectContaining({
      status: "CLOSED",
      questions: [expect.objectContaining({ correctOption: -1 })],
    }),
  ]);
  const body = {
    closesAt: "2099-01-01T00:00:00Z",
    questions: Array.from({ length: 10 }, () => question),
  };
  expect(await quizzesApi.create(2, 3, body)).toMatchObject({
    id: 7,
    status: "OPEN",
    questions: body.questions,
  });
  expect(request).toHaveBeenCalledWith("/subjects/3/activities", {
    method: "POST",
    body,
  });
  await expect(
    quizzesApi.create(2, 3, { questions: body.questions }),
  ).rejects.toThrow("encerramento");
  expect(await quizzesApi.themes(2, 3, signal)).toEqual(["Soma"]);
});

test("resultados preservam nota zero, escala de 0 a 10 e alunos sem entrega", async () => {
  const result = await quizzesApi.results(7, signal);
  expect(result.students[0]).toMatchObject({
    name: "Ana",
    score: {
      grade: 0,
      correct: 0,
      total: 10,
      themes: [{ theme: "Soma", errors: 10, total: 10 }],
      review: [],
    },
  });
  expect(result.students[1]).toMatchObject({
    name: "Bia",
    submittedAt: null,
    score: null,
  });
  request.mockImplementationOnce(async () => [
    {
      activity,
      submissions: [
        {
          studentId: 10,
          submittedAt: activity.createdAt,
          score: 80,
          correctAnswers: 8,
          questionCount: 10,
          themePerformance: [],
        },
      ],
    },
  ]);
  expect((await quizzesApi.results(7)).students[0].score?.grade).toBe(8);
  await expect(quizzesApi.results(999, signal)).rejects.toThrow(
    "não encontrada",
  );
});

test("relatórios consultam entregas uma vez e propagam cancelamento", async () => {
  expect(await quizzesApi.reports(signal)).toHaveLength(1);
  expect(
    request.mock.calls.filter(([path]) => path === "/teacher/activities"),
  ).toHaveLength(1);
  expect(
    request.mock.calls.every(([, options]) => options?.signal === signal),
  ).toBe(true);
});

test("atividades de outra escola não provocam consultas sem permissão", async () => {
  request.mockResolvedValueOnce([
    { activity: { ...activity, schoolId: 9 }, submissions: [] },
  ]);
  expect(await quizzesApi.activities(signal)).toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
});

test("convites usam o caminho do professor autenticado", async () => {
  request.mockResolvedValue([]);
  await schoolsApi.invitations(signal);
  await schoolsApi.respond(5, "ACCEPTED");
  expect(request).toHaveBeenCalledWith("/me/school-invitations", { signal });
  expect(request).toHaveBeenCalledWith("/me/school-invitations/5", {
    method: "PATCH",
    body: { status: "ACCEPTED" },
  });
});

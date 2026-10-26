jest.mock("@/mocks/access", () => ({
  ...jest.requireActual("@/mocks/access"),
  mockAccessEnabled: true,
}));
import { useAuthState } from "@/integrations/auth/state";
import { quizzesApi } from "@/integrations/quizzes/api";
import { subjectsApi } from "@/integrations/subjects/api";
import { createDemoSession, demoUsers } from "@/mocks/access";

afterEach(() => useAuthState.getState().setSession(null));

test("salva a ementa no mock e usa seus tópicos nos temas e nas questões", async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  const topic = {
    title: "Números racionais",
    description: "Operações com frações.",
    references: "Autor. Livro, 2025.",
  };
  const subject = await subjectsApi.create(5, {
    name: "Matemática",
    syllabus: "Números e representações.",
    topics: [topic],
  });
  expect(
    (await subjectsApi.list(5)).find((item) => item.id === subject.id),
  ).toMatchObject({ syllabus: "Números e representações.", topics: [topic] });
  expect(await quizzesApi.themes(5, subject.id)).toEqual([topic.title]);
  const questions = Array.from({ length: 10 }, () => ({
    question: "Quanto é 1/2 + 1/2?",
    options: ["1", "2", "3", "4"],
    correctOption: 0,
    theme: topic.title,
  }));
  expect(await quizzesApi.create(5, subject.id, { questions })).toMatchObject({
    subjectId: subject.id,
  });
  await expect(
    quizzesApi.create(5, subject.id, {
      questions: questions.map((question) => ({
        ...question,
        theme: "Tema externo",
      })),
    }),
  ).rejects.toThrow("tema válido");
});

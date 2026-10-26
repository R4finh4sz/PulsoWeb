jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
import { quizzesApi } from '@/integrations/quizzes/api';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';
import { scoreQuiz } from '@/utils/quizResults';

beforeEach(() => { global.fetch = jest.fn(); useAuthState.getState().setSession(createDemoSession(demoUsers[2])); });
afterEach(() => useAuthState.getState().setSession(null));

test('calcula nota e ordena temas pelos erros sem perder respostas individuais', () => {
  const question = { question: 'Pergunta', options: ['A', 'B', 'C', 'D'], correctOption: 0 };
  const result = scoreQuiz([{ ...question, theme: 'Frações' }, { ...question, theme: 'Geometria' }, { ...question, theme: 'Frações' }, { ...question, theme: 'Operações' }], [1, 1, null, 0]);
  expect(result).toMatchObject({ grade: 2.5, correct: 1, total: 4 });
  expect(result.themes).toEqual([{ theme: 'Frações', errors: 2, total: 2 }, { theme: 'Geometria', errors: 1, total: 1 }]);
  expect(result.review[0]).toMatchObject({ answer: 'B', correctAnswer: 'A', isCorrect: false });
  expect(result.review[2].answer).toBeNull();
  expect(scoreQuiz([{ ...question, theme: 'Frações' }], [0])).toMatchObject({ grade: 10, themes: [] });
});

test('retorna 40 alunos, separa quem não respondeu e inclui notas e erros', async () => {
  const results = await quizzesApi.results(1);
  expect(results.quiz).toMatchObject({ id: 1, teacherId: 3, subjectName: 'Matemática' });
  expect(results.students).toHaveLength(40);
  expect(results.students.filter(student => student.score !== null)).toHaveLength(30);
  expect(results.students.filter(student => student.score === null)).toHaveLength(10);
  expect(results.students[0].score?.grade).toBe(10);
  expect(results.students.some(student => student.score?.grade === 0)).toBe(true);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('quiz novo não inventa entregas e resultados são restritos ao professor', async () => {
  const quiz = await quizzesApi.create(1, 1, { questions: Array.from({ length: 10 }, () => ({ question: 'Quanto é 1 + 1?', options: ['1', '2', '3', '4'], theme: 'Operações básicas', correctOption: 1 })) });
  expect((await quizzesApi.results(quiz.id)).students.every(student => student.score === null)).toBe(true);
  await expect(quizzesApi.results(9999)).rejects.toThrow('não encontrado');
  useAuthState.getState().setSession(createDemoSession(demoUsers[3]));
  await expect(quizzesApi.results(1)).rejects.toThrow('Somente professores');
});

jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));

import { quizzesApi } from '@/integrations/quizzes/api';
import { subjectsApi } from '@/integrations/subjects/api';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';

beforeEach(() => { global.fetch = jest.fn(); useAuthState.getState().setSession(createDemoSession(demoUsers[2])); });
afterEach(() => useAuthState.getState().setSession(null));

test('cria quiz com 10 questões na matéria escolhida e isola a listagem', async () => {
  const themes = await quizzesApi.themes(1, 1);
  const body = { questions: Array.from({ length: 10 }, (_, index) => ({ question: `Pergunta ${index + 1}`, options: ['A', 'B', 'C', 'D'], theme: themes[0], correctOption: 0 })) };
  const quiz = await quizzesApi.create(1, 1, body);
  expect(quiz).toMatchObject({ subjectId: 1, classroomId: 1, teacherId: 3, status: 'OPEN' });
  expect(await quizzesApi.list(1, 1)).toContainEqual(quiz);
  const other = await subjectsApi.create(1, 'Português');
  expect(await quizzesApi.list(1, other.id)).toEqual([]);
  expect(await quizzesApi.themes(1, other.id)).toContain('Gramática');
  await expect(quizzesApi.create(1, 1, { questions: body.questions.slice(1) })).rejects.toThrow('exatamente 10');
  await expect(quizzesApi.create(1, 1, { questions: body.questions.map(question => ({ ...question, theme: 'Inválido' })) })).rejects.toThrow('tema válido');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('rejeita matéria de outra turma e acesso do aluno', async () => {
  await expect(quizzesApi.list(2, 1)).rejects.toThrow('Matéria não encontrada');
  useAuthState.getState().setSession(createDemoSession(demoUsers[3]));
  await expect(quizzesApi.list(1, 1)).rejects.toThrow('não vinculada');
});

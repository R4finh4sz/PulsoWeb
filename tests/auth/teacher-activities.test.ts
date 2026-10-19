jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
import { quizzesApi } from '@/integrations/quizzes/api';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';
import { mockTeacherQuizzes } from '@/mocks/quizzes';

beforeEach(() => { global.fetch = jest.fn(); useAuthState.getState().setSession(createDemoSession(demoUsers[2])); });
afterEach(() => { useAuthState.getState().setSession(null); jest.useRealTimers(); });

test('atividades incluem contexto, status e prazo e isolam o autor', async () => {
  const activities = await quizzesApi.activities();
  expect(activities.some(activity => activity.status === 'OPEN')).toBe(true);
  expect(activities.some(activity => activity.status === 'CLOSED')).toBe(true);
  expect(activities[0]).toMatchObject({ teacherId: 3, subjectName: 'Matemática', classroomName: '6º ano A', schoolName: 'EMEF Monte Serrat' });
  expect(activities.every(activity => Number.isFinite(Date.parse(activity.closesAt)))).toBe(true);
  expect(mockTeacherQuizzes({ ...demoUsers[2], id: 999 })).toEqual([]);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('quiz passa a finalizado no prazo e rejeita criação com data passada', async () => {
  const closesAt = new Date(Date.now() + 3600000).toISOString();
  const body = { closesAt, questions: Array.from({ length: 10 }, () => ({ question: 'Quanto é 1 + 1?', options: ['1', '2', '3', '4'], theme: 'Operações básicas', correctOption: 1 })) };
  const quiz = await quizzesApi.create(1, 1, body);
  expect(quiz.status).toBe('OPEN');
  jest.useFakeTimers(); jest.setSystemTime(new Date(closesAt));
  expect((await quizzesApi.activities()).find(activity => activity.id === quiz.id)?.status).toBe('CLOSED');
  await expect(quizzesApi.create(1, 1, body)).rejects.toThrow('no futuro');
});

test('alunos não podem consultar atividades de professor', async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[3]));
  await expect(quizzesApi.activities()).rejects.toThrow('Somente professores');
});

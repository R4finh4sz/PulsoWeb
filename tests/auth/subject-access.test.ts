jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
let subjectsApi: typeof import('@/integrations/subjects/api').subjectsApi;
let quizzesApi: typeof import('@/integrations/quizzes/api').quizzesApi;
let state: typeof import('@/integrations/auth/state').useAuthState;
let access: typeof import('@/mocks/access');
beforeEach(async () => {
  jest.resetModules();
  ({ subjectsApi } = await import('@/integrations/subjects/api'));
  ({ quizzesApi } = await import('@/integrations/quizzes/api'));
  ({ useAuthState: state } = await import('@/integrations/auth/state'));
  access = await import('@/mocks/access');
  global.fetch = jest.fn();
  login(3);
});
function login(id: number) { state.getState().setSession(access.createDemoSession(access.demoUsers.find(user => user.id === id)!)); }
afterEach(() => state.getState().setSession(null));

test('lista matérias de outros professores sem liberar conteúdo com convite pendente', async () => {
  expect(await subjectsApi.list(1)).toEqual(expect.arrayContaining([expect.objectContaining({ id: 2, teacherId: 5, teacherIds: [5] })]));
  expect(await subjectsApi.invitations()).toHaveLength(1);
  await expect(quizzesApi.list(1, 2)).rejects.toThrow('Aceite o convite');
  await expect(quizzesApi.themes(1, 2)).rejects.toThrow('Aceite o convite');
});
test('aceitar convite adiciona o professor à matéria e libera a URL direta', async () => {
  await subjectsApi.respond(1, 'ACCEPTED');
  expect((await subjectsApi.list(1)).find(subject => subject.id === 2)?.teacherIds).toEqual([5, 3]);
  expect(await quizzesApi.list(1, 2)).toEqual([]);
  expect(await quizzesApi.themes(1, 2)).toContain('Corpo humano');
  expect(await subjectsApi.invitations()).toEqual([]);
  expect(global.fetch).not.toHaveBeenCalled();
});
test('negar convite mantém a matéria bloqueada e não permite reaproveitar o convite', async () => {
  await subjectsApi.respond(1, 'REJECTED');
  await expect(quizzesApi.list(1, 2)).rejects.toThrow('Aceite o convite');
  await expect(subjectsApi.respond(1, 'ACCEPTED')).rejects.toThrow('já foi respondido');
});
test('somente o destinatário responde e somente o dono convida professores', async () => {
  login(5);
  await expect(subjectsApi.respond(1, 'ACCEPTED')).rejects.toThrow('Convite não encontrado');
  login(3);
  await expect(subjectsApi.invite(1, 2, 'outro@escola.com')).rejects.toThrow('não pode convidar');
});
test('professor convidado compartilha a matéria e seu conteúdo com o criador após aceitar', async () => {
  const invite = await subjectsApi.invite(1, 1, 'mariana@pulso.com');
  login(5);
  await expect(quizzesApi.list(1, 1)).rejects.toThrow('Aceite o convite');
  await subjectsApi.respond(invite.id, 'ACCEPTED');
  expect((await quizzesApi.list(1, 1)).length).toBeGreaterThan(0);
  const themes = await quizzesApi.themes(1, 1);
  const quiz = await quizzesApi.create(1, 1, { questions: Array.from({ length: 10 }, () => ({ question: 'Quanto é 1 + 1?', options: ['1', '2', '3', '4'], correctOption: 1, theme: themes[0] })) });
  login(3);
  expect(await quizzesApi.list(1, 1)).toContainEqual(quiz);
  expect((await quizzesApi.results(quiz.id)).quiz.id).toBe(quiz.id);
  await expect(subjectsApi.invite(1, 1, 'mariana@pulso.com')).rejects.toThrow('já faz parte');
});

test('convite para aluno não é permitido e um convite não pode ser respondido duas vezes', async () => {
  await expect(subjectsApi.invite(1, 1, 'aluno@pulso.com')).rejects.toThrow('professor');
  await subjectsApi.respond(1, 'ACCEPTED');
  await expect(subjectsApi.respond(1, 'REJECTED')).rejects.toThrow('já foi respondido');
});

export {};

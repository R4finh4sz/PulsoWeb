jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
let schoolsApi: typeof import('@/integrations/schools/api').schoolsApi;
let subjectsApi: typeof import('@/integrations/subjects/api').subjectsApi;
let profileApi: typeof import('@/integrations/profile/api').profileApi;
let state: typeof import('@/integrations/auth/state').useAuthState;
let access: typeof import('@/mocks/access');
beforeEach(async () => {
  jest.resetModules();
  ({ schoolsApi } = await import('@/integrations/schools/api'));
  ({ subjectsApi } = await import('@/integrations/subjects/api'));
  ({ profileApi } = await import('@/integrations/profile/api'));
  ({ useAuthState: state } = await import('@/integrations/auth/state'));
  access = await import('@/mocks/access');
  global.fetch = jest.fn();
  login(3);
});
function login(id: number) { state.getState().setSession(access.createDemoSession(access.demoUsers.find(user => user.id === id)!)); }
afterEach(() => state.getState().setSession(null));

test('convite pendente de escola não cria vínculo antecipadamente', async () => {
  expect(await schoolsApi.invitations()).toMatchObject([{ id: 1, schoolId: 4, status: 'PENDING' }]);
  expect((await profileApi.get()).schools.map(school => school.id)).toEqual([1, 2, 3]);
  expect((await schoolsApi.list()).find(school => school.id === 4)?.teacherIds).not.toContain(3);
});
test('aceitar outra escola adiciona vínculo e preserva escolas e turmas atuais', async () => {
  const before = await profileApi.get();
  await expect(schoolsApi.respond(1, 'ACCEPTED')).resolves.toMatchObject({ schoolId: 4, status: 'ACCEPTED' });
  const after = await profileApi.get();
  expect(after.schools.map(school => school.id)).toEqual([1, 2, 3, 4]);
  expect(after.user.schoolId).toBe(before.user.schoolId);
  expect(after.classrooms).toEqual(before.classrooms);
  expect(await schoolsApi.invitations()).toEqual([]);
  expect(await subjectsApi.invitations()).toHaveLength(1);
  await expect(schoolsApi.respond(1, 'ACCEPTED')).rejects.toThrow('já foi respondido');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('negar outra escola mantém vínculos anteriores e não permite aceite posterior', async () => {
  await schoolsApi.respond(1, 'REJECTED');
  expect((await profileApi.get()).schools.map(school => school.id)).toEqual([1, 2, 3]);
  await expect(schoolsApi.respond(1, 'ACCEPTED')).rejects.toThrow('já foi respondido');
});
test('outro professor não vê nem responde o convite de escola do destinatário', async () => {
  login(5);
  expect(await schoolsApi.invitations()).toEqual([]);
  await expect(schoolsApi.respond(1, 'ACCEPTED')).rejects.toThrow('não encontrado');
  login(3);
  expect(await schoolsApi.invitations()).toHaveLength(1);
});
test('aluno não pode responder convites de escolas', async () => {
  login(4);
  await expect(schoolsApi.respond(1, 'ACCEPTED')).rejects.toThrow('Somente professores');
});

export {};

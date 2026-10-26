jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
let profileApi: typeof import('@/integrations/profile/api').profileApi;
let useAuthState: typeof import('@/integrations/auth/state').useAuthState;
let createDemoSession: typeof import('@/mocks/access').createDemoSession;
let demoUsers: typeof import('@/mocks/access').demoUsers;

beforeEach(async () => {
  jest.resetModules();
  ({ profileApi } = await import('@/integrations/profile/api'));
  ({ useAuthState } = await import('@/integrations/auth/state'));
  ({ createDemoSession, demoUsers } = await import('@/mocks/access'));
  global.fetch = jest.fn();
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
});
afterEach(() => useAuthState.getState().setSession(null));

test('perfil e exportação retornam dados do professor sem credenciais', async () => {
  const profile = await profileApi.get();
  expect(profile.user).toEqual(demoUsers[2]);
  expect(profile.schools).toHaveLength(3);
  expect(profile.classrooms.every(room => room.teacherIds.includes(3))).toBe(true);
  const exported = await profileApi.export();
  expect(exported.user).toEqual(demoUsers[2]);
  expect(JSON.stringify(exported)).not.toContain('password');
  expect(JSON.stringify(exported)).not.toContain('accessToken');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('troca de senha valida senha atual, confirmação e nova credencial no mock', async () => {
  await expect(profileApi.changePassword({ currentPassword: 'errada', newPassword: 'Nova12345', confirmPassword: 'Nova12345' })).rejects.toThrow('senha atual');
  await expect(profileApi.changePassword({ currentPassword: 'Pulso123', newPassword: 'Nova12345', confirmPassword: 'Diferente123' })).rejects.toThrow('confirmação');
  await profileApi.changePassword({ currentPassword: 'Pulso123', newPassword: 'Nova12345', confirmPassword: 'Nova12345' });
  await expect(profileApi.changePassword({ currentPassword: 'Pulso123', newPassword: 'Outra12345', confirmPassword: 'Outra12345' })).rejects.toThrow('senha atual');
});

test('solicitação de exclusão é registrada sem remover o perfil', async () => {
  await profileApi.requestDeletion({ currentPassword: 'Pulso123', reason: 'Não utilizo mais a plataforma.' });
  expect(await profileApi.get()).toMatchObject({ deletionRequested: true, user: { id: 3 } });
  useAuthState.getState().setSession(createDemoSession(demoUsers[3]));
  await expect(profileApi.get()).rejects.toThrow('apenas para professores');
});

test.each(['', 'incorreta'])('exclusão rejeita senha atual ausente ou incorreta: %s', async currentPassword => {
  await expect(profileApi.requestDeletion({ currentPassword, reason: 'Não utilizo mais.' })).rejects.toThrow('A senha atual está incorreta.');
  expect((await profileApi.get()).deletionRequested).toBe(false);
});

test.each(['', '   ', 'a'.repeat(2001)])('exclusão rejeita motivo inválido sem registrar pedido', async reason => {
  await expect(profileApi.requestDeletion({ currentPassword: 'Pulso123', reason })).rejects.toThrow(reason.trim() ? 'O motivo deve ter no máximo 2000 caracteres.' : 'Informe o motivo da exclusão.');
  expect((await profileApi.get()).deletionRequested).toBe(false);
});

test('exclusão aceita motivo no limite e não permite pedido duplicado', async () => {
  const body = { currentPassword: 'Pulso123', reason: 'a'.repeat(2000) };
  await profileApi.requestDeletion(body);
  await expect(profileApi.requestDeletion(body)).rejects.toThrow('Já existe um pedido de exclusão pendente.');
  expect((await profileApi.get()).deletionRequested).toBe(true);
});

test('exclusão valida a senha atualizada após troca de senha', async () => {
  await profileApi.changePassword({ currentPassword: 'Pulso123', newPassword: 'Nova12345', confirmPassword: 'Nova12345' });
  await expect(profileApi.requestDeletion({ currentPassword: 'Pulso123', reason: 'Não utilizo mais.' })).rejects.toThrow('A senha atual está incorreta.');
  expect((await profileApi.get()).deletionRequested).toBe(false);
  await profileApi.requestDeletion({ currentPassword: 'Nova12345', reason: 'Não utilizo mais.' });
  expect((await profileApi.get()).deletionRequested).toBe(true);
});

export {};

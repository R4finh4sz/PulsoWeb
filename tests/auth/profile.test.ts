jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
import { profileApi } from '@/integrations/profile/api';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';

beforeEach(() => { global.fetch = jest.fn(); useAuthState.getState().setSession(createDemoSession(demoUsers[2])); });
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
  await profileApi.requestDeletion();
  expect(await profileApi.get()).toMatchObject({ deletionRequested: true, user: { id: 3 } });
  useAuthState.getState().setSession(createDemoSession(demoUsers[3]));
  await expect(profileApi.get()).rejects.toThrow('apenas para professores');
});

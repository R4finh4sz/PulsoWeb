jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
import { subjectsApi } from '@/integrations/subjects/api';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';

beforeEach(() => { global.fetch = jest.fn(); useAuthState.getState().setSession(createDemoSession(demoUsers[2])); });
afterEach(() => useAuthState.getState().setSession(null));

test('registra convite na matéria, valida email e impede duplicidade e autoconvite', async () => {
  const invite = await subjectsApi.invite(1, 1, ' NOVO@ESCOLA.COM ');
  expect(invite).toMatchObject({ email: 'novo@escola.com', subjectId: 1, status: 'PENDING' });
  await expect(subjectsApi.invite(1, 1, 'novo@escola.com')).rejects.toThrow('convite pendente');
  await expect(subjectsApi.invite(1, 1, 'invalido')).rejects.toThrow('e-mail válido');
  await expect(subjectsApi.invite(1, 1, demoUsers[2].email)).rejects.toThrow('já faz parte');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('limita matérias a sete por turma e permite criar em outra turma', async () => {
  for (let index = 0; index < 5; index++) await subjectsApi.create(1, `Matéria ${index}`);
  expect(await subjectsApi.list(1)).toHaveLength(7);
  await expect(subjectsApi.create(1, 'Oitava matéria')).rejects.toThrow('limite de 7');
  expect(await subjectsApi.create(2, 'Ciências')).toMatchObject({ classroomId: 2 });
});

test('aluno não pode criar matérias nem convidar professores', async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[3]));
  await expect(subjectsApi.create(1, 'Outra matéria')).rejects.toThrow('professor vinculado');
  await expect(subjectsApi.invite(1, 1, 'outro@escola.com')).rejects.toThrow('não vinculada');
});

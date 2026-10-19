jest.mock('@/mocks/access', () => ({
  ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true,
}));

import { apiRequest } from '@/api/client';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';
import type { Classroom, Subject, User } from '@/integrations/types';

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { useAuthState.getState().setSession(null); });

test.each(demoUsers)('perfil $role acessa sessão, termos e painel sem rede', async user => {
  useAuthState.getState().setSession(createDemoSession(user));
  expect(await apiRequest('/me')).toEqual(user);
  expect(await apiRequest('/terms/accepted')).toEqual(['demo-1']);
  expect(await apiRequest('/classrooms')).toHaveLength(user.role === 'STUDENT' ? 1 : 12);
  expect(await apiRequest('/schools')).toHaveLength(3);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('troca de sessão altera /me e mantém dados de turma coerentes', async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  const subjects = await apiRequest<Subject[]>('/classrooms/1/subjects');
  expect(subjects[0].teacherId).toBe(3);
  useAuthState.getState().setSession(createDemoSession(demoUsers[3]));
  expect(await apiRequest<User>('/me')).toMatchObject({ role: 'STUDENT', classroomId: 1 });
  const students = await apiRequest<User[]>('/classrooms/1/students');
  expect(students).toHaveLength(40);
  expect(students).toContainEqual(demoUsers[3]);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('criação de turma retorna registro e aparece na listagem local', async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[1]));
  const room = await apiRequest<Classroom>('/classrooms', { method: 'POST', body: { name: '7º ano B', identifier: '7B' } });
  expect(await apiRequest('/classrooms')).toContainEqual(room);
  await expect(apiRequest('/unsupported')).rejects.toThrow('ainda não está disponível no mock');
  expect(global.fetch).not.toHaveBeenCalled();
});

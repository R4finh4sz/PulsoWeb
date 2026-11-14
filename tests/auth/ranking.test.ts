jest.mock('@/mocks/access', () => ({
  ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true,
}));

import { apiRequest } from '@/api/client';
import type { RankingData } from '@/integrations/ranking/api';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';

afterEach(() => { useAuthState.getState().setSession(null); });

test('ranking reúne escolas e séries e renova os totais ao mudar de período', async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[0]));
  const ranking = await apiRequest<RankingData>('/ranking');
  expect(ranking.schools).toHaveLength(4);
  expect(ranking.grades).toHaveLength(3);
  expect(ranking.entries.some((entry) => entry.completedActivities > 0)).toBe(true);
  expect(new Set(ranking.entries.map((entry) => entry.schoolId)).size).toBeGreaterThan(1);
  jest.useFakeTimers();
  jest.setSystemTime(new Date(ranking.period.endsAt));
  const next = await apiRequest<RankingData>('/ranking');
  expect(next.period.startsAt).toBe(ranking.period.endsAt);
  expect(next.entries).toEqual([]);
});

test('alunos não podem consultar o ranking', async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers.find((user) => user.role === 'STUDENT')!));
  await expect(apiRequest('/ranking')).rejects.toThrow('Alunos não têm acesso');
});

test.each([demoUsers[1], demoUsers[4]])('$role vê global mas só filtra escola vinculada', async (user) => {
  useAuthState.getState().setSession(createDemoSession(user));
  const global = await apiRequest<RankingData>('/ranking');
  expect(global.schools.map((school) => school.id)).toEqual([1]);
  expect(global.canFilterGlobalGrades).toBe(false);
  expect(global.grades).toEqual([]);
  expect(global.classrooms).toEqual([]);
  expect(global.entries.every((entry) => entry.classroomName === null)).toBe(true);
  expect(global.entries.every((entry) => entry.grade === null)).toBe(true);
  expect(global.entries.some((entry) => entry.schoolId === 2)).toBe(true);
  await expect(apiRequest('/ranking?schoolId=2')).rejects.toThrow('Você não tem acesso');
  await expect(apiRequest('/ranking?grade=1')).rejects.toThrow('Selecione uma escola');
  const local = await apiRequest<RankingData>('/ranking?schoolId=1');
  expect(local.grades.length).toBeGreaterThan(0);
  expect(local.classrooms?.map((room) => room.name)).toEqual(expect.arrayContaining(['1º ano A', '1º ano B', '1º ano C']));
  const turma = await apiRequest<RankingData>('/ranking?schoolId=1&classroomId=1');
  expect(turma.entries.length).toBeGreaterThan(0);
  expect(turma.entries.every((entry) => entry.classroomName === '1º ano A')).toBe(true);
  await expect(apiRequest('/ranking?schoolId=1&classroomId=2')).rejects.toThrow('Selecione uma turma');
  await expect(apiRequest('/ranking?classroomId=1')).rejects.toThrow('Selecione uma turma');
  expect(local.entries.every((entry) => entry.schoolId === 1 && entry.grade !== null)).toBe(true);
});

test('professor pode selecionar todas as suas escolas e admin pode selecionar qualquer escola', async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  const teacher = await apiRequest<RankingData>('/ranking');
  expect(teacher.schools.map((school) => school.id)).toEqual([1, 2, 3]);
  await expect(apiRequest('/ranking?schoolId=4')).rejects.toThrow('Você não tem acesso');
  useAuthState.getState().setSession(createDemoSession(demoUsers[0]));
  const admin = await apiRequest<RankingData>('/ranking?schoolId=2');
  expect(admin.schools).toHaveLength(4);
  expect(admin.entries.length).toBeGreaterThan(0);
  expect(admin.entries.every((entry) => entry.schoolId === 2 && entry.grade !== null)).toBe(true);
});

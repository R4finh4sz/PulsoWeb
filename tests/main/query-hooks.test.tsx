import { renderHook, act, waitFor } from '@testing-library/react';
import { useClassroom, useClassrooms } from '@/integrations/classrooms/hooks';
import { useSchools } from '@/integrations/schools/hooks';
import { useUsers } from '@/integrations/users/hooks';
import { useSchoolCoordinators } from '@/hooks/useSchoolCoordinators';
import { useApiMutation } from '@/integrations/useApiMutation';
import { useCoordinatorStore } from '@/store/coordinatorStore';
import { useFeedbackStore } from '@/store/feedbackStore';
import { classroomsApi } from '@/integrations/classrooms/api';
import { schoolsApi } from '@/integrations/schools/api';
import { usersApi } from '@/integrations/users/api';
import { authApi } from '@/integrations/auth/api';
import { queryWrapper } from '../helpers';
jest.mock('@/integrations/classrooms/api', () => ({ classroomsApi: { list: jest.fn(), get: jest.fn() } }));
jest.mock('@/integrations/schools/api', () => ({ schoolsApi: { list: jest.fn() } }));
jest.mock('@/integrations/users/api', () => ({ usersApi: { list: jest.fn() } }));
jest.mock('@/integrations/auth/api', () => ({ authApi: { me: jest.fn() } }));
test('consultas recebem signal e populam cache', async () => {
  jest.mocked(classroomsApi.list).mockResolvedValue([]); jest.mocked(classroomsApi.get).mockResolvedValue({ id: 1 } as Awaited<ReturnType<typeof classroomsApi.get>>);
  jest.mocked(schoolsApi.list).mockResolvedValue([]); jest.mocked(usersApi.list).mockResolvedValue({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  const { result } = renderHook(() => ({ rooms: useClassrooms(), room: useClassroom(1), schools: useSchools(), users: useUsers('students') }), { wrapper: queryWrapper().wrapper });
  await waitFor(() => expect(Object.values(result.current).every(query => query.isSuccess)).toBe(true));
  expect(classroomsApi.get).toHaveBeenCalledWith(1, expect.any(AbortSignal)); expect(usersApi.list).toHaveBeenCalledWith('students', {}, expect.any(AbortSignal));
});
test.each([0, -1, NaN, 1.5])('não consulta turma inválida %s', id => {
  renderHook(() => ({ room: useClassroom(id), rooms: useClassrooms(false), schools: useSchools(false), users: useUsers('students', {}, false) }), { wrapper: queryWrapper().wrapper });
  expect(classroomsApi.get).not.toHaveBeenCalled(); expect(classroomsApi.list).not.toHaveBeenCalled(); expect(schoolsApi.list).not.toHaveBeenCalled(); expect(usersApi.list).not.toHaveBeenCalled();
});
test('coordenadores carregam todas as páginas e substituem dados locais por id', async () => {
  useCoordinatorStore.setState({ coordinators: [{ id: '1', name: 'Local', role: 'coordenador', birthDate: '', registration: '' }] });
  jest.mocked(authApi.me).mockResolvedValue({ role: 'ADMIN' } as Awaited<ReturnType<typeof authApi.me>>);
  jest.mocked(usersApi.list).mockResolvedValueOnce({ totalPages: 2, content: [{ id: 1, fullName: 'Servidor', ra: '1', email: 'a@b.com' }] } as Awaited<ReturnType<typeof usersApi.list>>)
    .mockResolvedValueOnce({ totalPages: 2, content: [{ id: 2, fullName: 'Outro', ra: '2', email: 'c@b.com' }] } as Awaited<ReturnType<typeof usersApi.list>>);
  const { result } = renderHook(useSchoolCoordinators, { wrapper: queryWrapper().wrapper });
  await waitFor(() => expect(result.current.coordinators).toHaveLength(2));
  expect(result.current.coordinators[0].name).toBe('Servidor'); expect(usersApi.list).toHaveBeenNthCalledWith(2, 'coordinators', { page: 1, size: 100 }, expect.any(AbortSignal));
});
test.each([null, { role: 'TEACHER' }])('não busca coordenadores sem administrador', async user => {
  jest.mocked(authApi.me).mockResolvedValue(user as Awaited<ReturnType<typeof authApi.me>>);
  const { result } = renderHook(useSchoolCoordinators, { wrapper: queryWrapper().wrapper });
  await waitFor(() => expect(authApi.me).toHaveBeenCalled()); expect(result.current.coordinators).toEqual(useCoordinatorStore.getState().coordinators); expect(usersApi.list).not.toHaveBeenCalled();
});
test.each([undefined, new Error('Falha parcial'), 'failure'])('mutação invalida caches e apresenta resultado: %s', async failure => {
  const { client, wrapper } = queryWrapper(); const invalidate = jest.spyOn(client, 'invalidateQueries');
  const mutate = jest.fn(async () => { if (failure) throw failure; return 1; });
  const { result } = renderHook(() => useApiMutation(mutate), { wrapper });
  await act(async () => { await result.current.mutateAsync(undefined).catch(() => {}); });
  expect(mutate).toHaveBeenCalledTimes(1);
  for (const key of ['users', 'classrooms', 'subjects']) expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] });
  expect(useFeedbackStore.getState().feedback?.type).toBe(failure ? 'error' : 'success');
});

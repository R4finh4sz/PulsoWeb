import { renderHook, act, waitFor } from '@testing-library/react';
import { useMe, useLogin, useLogout } from '@/integrations/auth/hooks';
import { authApi } from '@/integrations/auth/api';
import { useAuthState } from '@/integrations/auth/state';
import { useSession } from '@/hooks/useSession';
import { useLoginForm } from '@/hooks/useLoginForm';
import { queryWrapper, router, session } from '../helpers';
import type { SyntheticEvent } from 'react';
jest.mock('next/navigation', () => ({ useRouter: () => router }));
jest.mock('@/integrations/auth/api', () => ({ authApi: { me: jest.fn(), login: jest.fn(), logout: jest.fn() } }));
const me = { id: 1, fullName: 'Ana', email: 'a@b.com', role: 'ADMIN' } as Awaited<ReturnType<typeof authApi.me>>;
const event = () => ({ preventDefault: jest.fn() } as unknown as SyntheticEvent<HTMLFormElement>);
test('login cancela cache anterior, limpa demonstração e grava credenciais', async () => {
  const { client, wrapper } = queryWrapper(); client.setQueryData(['old'], 'secret');
  sessionStorage.setItem('pulso-demo-session', 'old'); useAuthState.getState().setSession(session);
  jest.mocked(authApi.login).mockResolvedValue(session);
  const { result } = renderHook(useLogin, { wrapper });
  await act(async () => { await result.current.mutateAsync({ email: 'a@b.com', password: 'x' }); });
  expect(client.getQueryData(['old'])).toBeUndefined(); expect(sessionStorage.getItem('pulso-demo-session')).toBeNull();
  expect(useAuthState.getState().session).toEqual(session);
});
test.each([false, true])('logout limpa sessão e cache mesmo quando falha: %s', async fail => {
  const { client, wrapper } = queryWrapper(); client.setQueryData(['old'], 'secret');
  useAuthState.getState().setSession(session);
  if (fail) jest.mocked(authApi.logout).mockRejectedValue(new Error('offline')); else jest.mocked(authApi.logout).mockResolvedValue();
  const { result } = renderHook(useLogout, { wrapper });
  await act(async () => { await result.current.mutateAsync().catch(() => {}); });
  expect(useAuthState.getState().session).toBeNull(); expect(client.getQueryData(['old'])).toBeUndefined(); expect(client.getQueryData(['session'])).toBeNull();
});
test('consulta sessão encaminha signal', async () => {
  jest.mocked(authApi.me).mockResolvedValue(me); const { result } = renderHook(useMe, { wrapper: queryWrapper().wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true)); expect(authApi.me).toHaveBeenCalledWith(expect.any(AbortSignal));
});
test.each([['admin', me, undefined], ['professor', me, '/admin'], ['admin', null, '/']] as const)('useSession trata papel %s', async (role, data, route) => {
  jest.mocked(authApi.me).mockResolvedValue(data); const { result } = renderHook(() => useSession(role), { wrapper: queryWrapper().wrapper });
  if (route) { await waitFor(() => expect(router.replace).toHaveBeenCalledWith(route)); expect(result.current).toBeNull(); }
  else await waitFor(() => expect(result.current?.name).toBe('Ana'));
});
test('erro de sessão não dispara redirecionamento', async () => {
  jest.mocked(authApi.me).mockRejectedValue(new Error('offline')); renderHook(() => useSession('admin'), { wrapper: queryWrapper().wrapper });
  await waitFor(() => expect(authApi.me).toHaveBeenCalled()); expect(router.replace).not.toHaveBeenCalled();
});
test('formulário de login valida, salva e limpa senha', async () => {
  jest.mocked(authApi.login).mockResolvedValue(session); const { result } = renderHook(useLoginForm, { wrapper: queryWrapper().wrapper });
  await act(async () => { await result.current.handleSubmit(event()); });
  expect(result.current.errors).toHaveProperty('email'); expect(authApi.login).not.toHaveBeenCalled();
  act(() => { result.current.setField('email', 'a@b.com'); result.current.setField('password', 'Password1'); });
  await act(async () => { await result.current.handleSubmit(event()); });
  expect(router.replace).toHaveBeenCalledWith('/'); expect(result.current.values.password).toBe(''); expect(result.current.errors).toEqual({});
});
test.each([new Error('Credenciais inválidas'), 'failure'])('login exibe erro e permite nova tentativa: %s', async error => {
  jest.mocked(authApi.login).mockRejectedValue(error); const { result } = renderHook(useLoginForm, { wrapper: queryWrapper().wrapper });
  act(() => { result.current.setField('email', 'a@b.com'); result.current.setField('password', 'x'); });
  await act(async () => { await result.current.handleSubmit(event()); }); expect(result.current.error).toBeTruthy();
  act(() => result.current.setField('password', 'new')); expect(result.current.error).toBe('');
});
test('submissão duplicada faz apenas uma requisição', async () => {
  let resolve!: (value: typeof session) => void;
  jest.mocked(authApi.login).mockImplementation(() => new Promise(done => { resolve = done; }));
  const { result } = renderHook(useLoginForm, { wrapper: queryWrapper().wrapper });
  act(() => { result.current.setField('email', 'a@b.com'); result.current.setField('password', 'x'); });
  let pending!: Promise<void>;
  act(() => { pending = result.current.handleSubmit(event()); });
  await act(async () => { await result.current.handleSubmit(event()); });
  await waitFor(() => expect(authApi.login).toHaveBeenCalledTimes(1));
  await act(async () => { resolve(session); await pending; });
});

import { authService } from '@/services/auth';
import { LoginSchema } from '@/validation/Login.validation';
import { toSessionUser } from '@/integrations/auth/session';
import { useAuthState } from '@/integrations/auth/state';
import { useLoginStore } from '@/store/loginStore';
import { session, admin } from '../helpers';

test('login demonstrativo normaliza email e devolve cópia do usuário', () => {
  const user = authService.login({ email: ' ADMIN@PULSO.COM ', password: 'Pulso123' });
  expect(user.role).toBe('admin');
  user.name = 'changed';
  expect(authService.login({ email: 'admin@pulso.com', password: 'Pulso123' }).name).not.toBe('changed');
  expect(() => authService.login({ email: 'unknown@example.com', password: 'Pulso123' })).toThrow();
  expect(() => authService.login({ email: 'admin@pulso.com', password: 'wrong' })).toThrow();
});
test('validação exige email válido e senha', () => {
  expect(LoginSchema.safeParse({ email: 'a@example.com', password: 'x' }).success).toBe(true);
  expect(LoginSchema.safeParse({ email: 'bad', password: '' }).success).toBe(false);
});
test.each([['ADMIN', 'admin'], ['PEDAGOGICAL_COORDINATOR', 'coordenador'], ['TEACHER', 'professor'], ['STUDENT', 'aluno']] as const)('mapeia papel %s', (role, expected) => {
  expect(toSessionUser({ id: 42, fullName: 'Ana', email: 'a@b.com', role } as Parameters<typeof toSessionUser>[0])).toEqual({ id: '42', name: 'Ana', email: 'a@b.com', role: expected });
});
test('stores gravam sessão e removem credenciais no logout', () => {
  useAuthState.getState().setSession(session);
  expect(JSON.parse(sessionStorage.getItem('pulso-auth-v2')!).state.session.accessToken).toBe('token');
  useAuthState.getState().setSession(null); expect(useAuthState.getState().session).toBeNull();
  useLoginStore.getState().setUser(admin); expect(useLoginStore.getState().user).toEqual(admin);
  useLoginStore.getState().logout(); expect(useLoginStore.getState().user).toBeNull();
});

import { AuthGate } from '@/components/screens/Login/AuthGate';
import { useAuthState } from '@/integrations/auth/state';
import { render, screen } from '@testing-library/react';
import { queryWrapper, router, session } from '../helpers';
jest.mock('next/navigation', () => ({ usePathname: () => '/student', useRouter: () => router }));

afterEach(() => useAuthState.getState().setSession(null));
test('sessão antiga de aluno é removida e retorna ao login', () => {
  useAuthState.getState().setSession({ ...session, user: { ...session.user, role: 'STUDENT' } });
  render(<AuthGate><p>Conteúdo da plataforma</p></AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(useAuthState.getState().session).toBeNull();
  expect(router.replace).toHaveBeenCalledWith('/');
  expect(screen.queryByText('Conteúdo da plataforma')).not.toBeInTheDocument();
});

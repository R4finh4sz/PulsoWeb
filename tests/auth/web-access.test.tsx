import { render, screen } from '@testing-library/react';
import { AuthGate } from '@/components/screens/Login/AuthGate';
import { useAuthState } from '@/integrations/auth/state';
import { queryWrapper, router, session } from '../helpers';
jest.mock('next/navigation', () => ({ usePathname: () => '/student', useRouter: () => router }));

afterEach(() => useAuthState.getState().setSession(null));
test('aluno recebe orientação para aplicativo e não acessa conteúdo web', () => {
  useAuthState.getState().setSession({ ...session, user: { ...session.user, role: 'STUDENT' } });
  render(<AuthGate><p>Conteúdo da plataforma</p></AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(screen.getByRole('heading', { name: 'Acesso pelo aplicativo' })).toBeVisible();
  expect(screen.queryByText('Conteúdo da plataforma')).not.toBeInTheDocument();
});

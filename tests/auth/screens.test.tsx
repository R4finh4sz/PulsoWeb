import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Login } from '@/components/screens/Login';
import { ForgotPassword } from '@/components/screens/ForgotPassword';
import { TwoFactorScreen } from '@/components/screens/Login/TwoFactorScreen';
import { AuthGate } from '@/components/screens/Login/AuthGate';
import { authApi } from '@/integrations/auth/api';
import { useAuthState } from '@/integrations/auth/state';
import { queryWrapper, router, session } from '../helpers';
let pathname = '/admin';
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => pathname }));
jest.mock('@/integrations/auth/api', () => ({ authApi: { me: jest.fn(), login: jest.fn(), verify: jest.fn(), resend: jest.fn(), terms: jest.fn(), accepted: jest.fn(), accept: jest.fn(), requestPasswordReset: jest.fn(), verifyPasswordReset: jest.fn(), resetPassword: jest.fn() } }));
beforeEach(() => {
  pathname = '/admin'; useAuthState.getState().setSession(null);
  jest.mocked(authApi.me).mockResolvedValue({ id: 1, fullName: 'Ana', email: 'a@b.com', role: 'ADMIN' } as Awaited<ReturnType<typeof authApi.me>>);
  jest.mocked(authApi.terms).mockResolvedValue({ title: 'Termos', version: '1', content: 'Conteúdo' });
  jest.mocked(authApi.accepted).mockResolvedValue(['1']); jest.mocked(authApi.accept).mockResolvedValue();
});
test('tela de login valida e mostra erros do servidor', async () => {
  jest.mocked(authApi.login).mockRejectedValue(new Error('Senha incorreta'));
  const { container } = render(<Login />, { wrapper: queryWrapper().wrapper });
  expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/forgot-password');
  fireEvent.submit(container.querySelector('form')!); expect(screen.getAllByRole('alert')).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@b.com' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'x' } });
  fireEvent.submit(container.querySelector('form')!); expect(await screen.findByText('Senha incorreta')).toBeVisible();
});
async function recovery() {
  const view = render(<ForgotPassword />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@b.com' } });
  fireEvent.submit(view.container.querySelector('form')!);
  fireEvent.click(await screen.findByRole('button', { name: 'Continuar' }));
  const digits = screen.getAllByRole('textbox');
  fireEvent.change(digits[0], { target: { value: '1' } });
  fireEvent.keyDown(digits[1], { key: 'Backspace' }); expect(digits[0]).toHaveValue('');
  fireEvent.keyDown(digits[0], { key: 'ArrowRight' }); expect(digits[1]).toHaveFocus();
  fireEvent.keyDown(digits[1], { key: 'ArrowLeft' });
  fireEvent.paste(digits[0], { clipboardData: { getData: () => '123456' } });
  return view;
}
test('recuperação verifica código, compara confirmação e redefine senha', async () => {
  jest.mocked(authApi.requestPasswordReset).mockResolvedValue(); jest.mocked(authApi.verifyPasswordReset).mockResolvedValue(); jest.mocked(authApi.resetPassword).mockResolvedValue();
  const { container } = await recovery(); fireEvent.submit(container.querySelector('form')!);
  await screen.findByLabelText('Nova senha');
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'Password1' } });
  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'Other123' } });
  fireEvent.submit(container.querySelector('form')!); expect(screen.getByRole('alert')).toHaveTextContent('iguais');
  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'Password1' } });
  fireEvent.submit(container.querySelector('form')!); await screen.findByLabelText('E-mail');
  expect(authApi.resetPassword).toHaveBeenCalledWith('a@b.com', '123456', 'Password1');
});
test.each([new Error('Código inválido'), 'failure'])('recuperação mostra falha no código e senha: %s', async failure => {
  jest.mocked(authApi.requestPasswordReset).mockRejectedValue(new Error('email absent'));
  jest.mocked(authApi.verifyPasswordReset).mockRejectedValueOnce(failure).mockResolvedValueOnce();
  jest.mocked(authApi.resetPassword).mockRejectedValue(failure);
  const { container } = await recovery(); fireEvent.submit(container.querySelector('form')!); await screen.findByRole('alert');
  fireEvent.change(screen.getByLabelText('Dígito 1 de 6'), { target: { value: '654321' } });
  fireEvent.submit(container.querySelector('form')!); await screen.findByLabelText('Nova senha');
  for (const label of ['Nova senha', 'Repita a nova senha']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'Password1' } });
  fireEvent.submit(container.querySelector('form')!); expect(await screen.findByRole('alert')).toBeVisible();
});
test('2FA distribui autofill, navega entre dígitos e verifica', async () => {
  jest.mocked(authApi.verify).mockResolvedValue();
  const { container } = render(<TwoFactorScreen session={{ ...session, twoFactorRequired: true }} />, { wrapper: queryWrapper().wrapper });
  const digits = screen.getAllByRole('textbox');
  fireEvent.change(digits[0], { target: { value: '1' } }); fireEvent.keyDown(digits[1], { key: 'Backspace' });
  expect(digits[0]).toHaveValue(''); fireEvent.keyDown(digits[0], { key: 'ArrowRight' }); expect(digits[1]).toHaveFocus();
  fireEvent.keyDown(digits[1], { key: 'ArrowLeft' }); fireEvent.keyDown(digits[0], { key: 'a' });
  fireEvent.submit(container.querySelector('form')!); expect(authApi.verify).not.toHaveBeenCalled();
  fireEvent.paste(digits[4], { clipboardData: { getData: () => '123456' } });
  expect(digits.map(input => (input as HTMLInputElement).value).join('')).toBe('123456');
  fireEvent.submit(container.querySelector('form')!); fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(useAuthState.getState().session?.twoFactorRequired).toBe(false)); expect(authApi.verify).toHaveBeenCalledTimes(1);
});
test('2FA mostra erro e reenvia código limpando campos', async () => {
  jest.mocked(authApi.verify).mockRejectedValue(new Error('Código inválido'));
  jest.mocked(authApi.resend).mockResolvedValue({ twoFactorRequired: true, codeExpiresAt: session.codeExpiresAt, resendAvailableAt: session.resendAvailableAt });
  const { container } = render(<TwoFactorScreen session={session} />, { wrapper: queryWrapper().wrapper });
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '123456' } }); fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent('Código inválido');
  fireEvent.click(screen.getByRole('button', { name: 'Reenviar' }));
  await waitFor(() => expect(screen.getAllByRole('textbox')[0]).toHaveValue(''));
});
test('2FA bloqueia código expirado e respeita espera do reenvio', () => {
  render(<TwoFactorScreen session={{ ...session, codeExpiresAt: '2000-01-01', resendAvailableAt: '2099-01-01' }} />, { wrapper: queryWrapper().wrapper });
  expect(screen.getByRole('status')).toHaveTextContent('expirado'); expect(screen.getByRole('button', { name: /Reenviar em/ })).toBeDisabled();
});
test.each(['/', '/registro', '/convite/abc', '/esqueci-senha', '/forgot-password'])('gate libera rota pública %s', path => {
  pathname = path; render(<AuthGate><p>Conteúdo protegido</p></AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(screen.getByText('Conteúdo protegido')).toBeVisible(); expect(router.replace).not.toHaveBeenCalled();
});
test('gate redireciona visitante e expira credenciais', () => {
  const { rerender } = render(<AuthGate><p>Privado</p></AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(router.replace).toHaveBeenCalledWith('/'); expect(screen.queryByText('Privado')).toBeNull();
  act(() => useAuthState.getState().setSession({ ...session, expiresAt: '2000-01-01' }));
  rerender(<AuthGate><p>Privado</p></AuthGate>); expect(useAuthState.getState().session).toBeNull();
});
test('gate exige 2FA quando indicado', () => {
  useAuthState.getState().setSession({ ...session, twoFactorRequired: true }); render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(screen.getByText('Confirme seu acesso')).toBeVisible();
});
test.each([true, false])('gate permite acesso após termos: %s', absent => {
  if (absent) jest.mocked(authApi.terms).mockResolvedValue(null);
  useAuthState.getState().setSession(session); render(<AuthGate><p>Privado</p></AuthGate>, { wrapper: queryWrapper().wrapper });
  return expect(screen.findByText('Privado')).resolves.toBeVisible();
});
test('gate pede leitura, checkbox e aceite da versão atual', async () => {
  jest.mocked(authApi.accepted).mockResolvedValueOnce([]).mockResolvedValue(['1']);
  useAuthState.getState().setSession(session); render(<AuthGate><p>Privado</p></AuthGate>, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole('button', { name: 'Ler termos de uso' }));
  expect(screen.getByText('Conteúdo')).toBeVisible(); expect(screen.getByRole('button', { name: 'Aceitar e continuar' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar e continuar' })); await screen.findByText('Privado'); expect(authApi.accept).toHaveBeenCalledWith('1');
});
test('erro de aceite limpa checkbox e atualiza termos', async () => {
  jest.mocked(authApi.accepted).mockResolvedValue([]); jest.mocked(authApi.accept).mockRejectedValue(new Error('Versão mudou'));
  useAuthState.getState().setSession(session); render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  fireEvent.click(await screen.findByRole('button', { name: 'Ler termos de uso' })); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Aceitar e continuar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Versão mudou'); expect(screen.getByRole('checkbox')).not.toBeChecked();
});
test('gate permite tentar novamente após erro de termos', async () => {
  jest.mocked(authApi.terms).mockRejectedValueOnce(new Error('Termos offline')).mockResolvedValue(null);
  useAuthState.getState().setSession(session); render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole('alert')).toHaveTextContent('Termos offline'); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Privado');
});
test('gate trata erro de perfil e redireciona para papel correto', async () => {
  jest.mocked(authApi.me).mockRejectedValueOnce(new Error('Perfil offline')).mockResolvedValue({ id: 1, fullName: 'Ana', role: 'ADMIN' } as Awaited<ReturnType<typeof authApi.me>>);
  pathname = '/professor'; useAuthState.getState().setSession(session); render(<AuthGate>Privado</AuthGate>, { wrapper: queryWrapper().wrapper });
  expect(await screen.findByRole('alert')).toHaveTextContent('Perfil offline'); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin'));
});

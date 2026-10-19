import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TeacherProfileScreen } from '@/components/screens/TeacherProfile';
import { profileApi } from '@/integrations/profile/api';
import { authApi } from '@/integrations/auth/api';
import { useAuthState } from '@/integrations/auth/state';
import { createDemoSession, demoUsers } from '@/mocks/access';
import { queryWrapper, router } from '../helpers';

jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true }));
jest.mock('next/navigation', () => ({ useRouter: () => router }));
jest.mock('@/integrations/auth/api', () => ({ authApi: { logout: jest.fn() } }));
jest.mock('@/integrations/profile/api', () => ({ profileApi: { get: jest.fn(), changePassword: jest.fn(), requestDeletion: jest.fn(), export: jest.fn() } }));
jest.mock('@/components/screens/Dashboard/TeacherShell', () => ({ TeacherShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/components/screens/Integration/shared', () => ({
  ...jest.requireActual('@/components/screens/Integration/shared'),
  Protected: ({ children }: { children: (user: { id: string; name: string; email: string; role: 'professor' }) => React.ReactNode }) => children({ id: '3', name: 'Paulo Professor', email: 'professor@pulso.com', role: 'professor' }),
}));

beforeEach(() => {
  jest.mocked(authApi.logout).mockReset().mockResolvedValue(undefined);
  jest.mocked(profileApi.changePassword).mockReset().mockResolvedValue(undefined);
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  jest.mocked(profileApi.get).mockResolvedValue({ user: demoUsers[2], schools: [], classrooms: [], deletionRequested: false });
  jest.mocked(profileApi.requestDeletion).mockReset().mockResolvedValue(undefined);
});
afterEach(() => useAuthState.getState().setSession(null));

async function openDeletion() {
  const view = render(<TeacherProfileScreen />, { wrapper: queryWrapper().wrapper });
  await screen.findByText('Nenhuma escola vinculada');
  fireEvent.click(screen.getByRole('button', { name: 'Solicitar exclusão de conta' }));
  return view;
}

test('alternar os formulários não reutiliza campos nem muda o modo de controle', async () => {
  const errors = jest.spyOn(console, 'error');
  try {
    render(<TeacherProfileScreen />, { wrapper: queryWrapper().wrapper });
    await screen.findByText('Nenhuma escola vinculada');
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
    const passwordField = screen.getByLabelText('Senha atual');
    fireEvent.change(passwordField, { target: { value: 'SenhaDaTroca123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar exclusão de conta' }));
    const deletionField = screen.getByLabelText('Senha atual');
    expect(deletionField).not.toBe(passwordField);
    expect(deletionField).toHaveValue('');
    fireEvent.change(deletionField, { target: { value: 'SenhaDaExclusao123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
    expect(screen.getByLabelText('Senha atual')).not.toBe(deletionField);
    expect(screen.getByLabelText('Senha atual')).toHaveValue('');
    expect(errors).not.toHaveBeenCalled();
  } finally {
    errors.mockRestore();
  }
});

test('exclusão exige senha e motivo e envia os dados preenchidos', async () => {
  await openDeletion();
  const password = screen.getByLabelText('Senha atual');
  const reason = screen.getByLabelText('Motivo da exclusão');
  const submit = screen.getByRole('button', { name: 'Solicitar exclusão' });
  expect(password).toBeRequired();
  expect(reason).toBeRequired();
  expect(reason).toHaveAttribute('maxlength', '2000');
  expect(submit).toBeDisabled();
  fireEvent.change(password, { target: { value: 'Pulso123' } });
  fireEvent.change(reason, { target: { value: '   ' } });
  expect(submit).toBeDisabled();
  expect(profileApi.requestDeletion).not.toHaveBeenCalled();
  fireEvent.change(reason, { target: { value: ' Não utilizo mais a plataforma. ' } });
  fireEvent.click(submit);
  await waitFor(() => expect(profileApi.requestDeletion).toHaveBeenCalledWith({ currentPassword: 'Pulso123', reason: 'Não utilizo mais a plataforma.' }, expect.anything()));
  expect(await screen.findByRole('heading', { name: 'Solicitação registrada' })).toBeVisible();
});

test('senha incorreta mantém o formulário aberto e permite tentar novamente', async () => {
  jest.mocked(profileApi.requestDeletion).mockRejectedValueOnce(new Error('A senha atual está incorreta.'));
  await openDeletion();
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'errada' } });
  fireEvent.change(screen.getByLabelText('Motivo da exclusão'), { target: { value: 'Não utilizo mais.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Solicitar exclusão' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('A senha atual está incorreta.');
  expect(screen.getByLabelText('Motivo da exclusão')).toHaveValue('Não utilizo mais.');
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'Pulso123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Solicitar exclusão' }));
  expect(await screen.findByRole('heading', { name: 'Solicitação registrada' })).toBeVisible();
});

test('cancelar não envia solicitação e limpa os campos ao reabrir', async () => {
  await openDeletion();
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'Pulso123' } });
  fireEvent.change(screen.getByLabelText('Motivo da exclusão'), { target: { value: 'Não utilizo mais.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(profileApi.requestDeletion).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Solicitar exclusão de conta' }));
  expect(screen.getByLabelText('Senha atual')).toHaveValue('');
  expect(screen.getByLabelText('Motivo da exclusão')).toHaveValue('');
});

async function openPassword() {
  const { client, wrapper } = queryWrapper();
  render(<TeacherProfileScreen />, { wrapper });
  await screen.findByText('Nenhuma escola vinculada');
  fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'Pulso123' } });
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'Nova12345' } });
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'Nova12345' } });
  client.setQueryDefaults(['private-cache'], { gcTime: Infinity });
  client.setQueryData(['private-cache'], { privateData: true });
  return client;
}

test.each([false, true])('troca de senha desconecta e limpa o cache mesmo com falha no logout: %s', async logoutFails => {
  if (logoutFails) jest.mocked(authApi.logout).mockRejectedValueOnce(new Error('Servidor indisponível'));
  const client = await openPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  expect(profileApi.changePassword).toHaveBeenCalledWith({ currentPassword: 'Pulso123', newPassword: 'Nova12345', confirmPassword: 'Nova12345' }, expect.anything());
  expect(authApi.logout).toHaveBeenCalledTimes(1);
  expect(useAuthState.getState().session).toBeNull();
  expect(JSON.parse(sessionStorage.getItem('pulso-auth-v2')!).state.session).toBeNull();
  expect(client.getQueryData(['private-cache'])).toBeUndefined();
});

test('falha ao trocar senha preserva a sessão e não chama logout', async () => {
  jest.mocked(profileApi.changePassword).mockRejectedValueOnce(new Error('A senha atual está incorreta.'));
  const client = await openPassword();
  const session = useAuthState.getState().session;
  fireEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('A senha atual está incorreta.');
  expect(useAuthState.getState().session).toEqual(session);
  expect(client.getQueryData(['private-cache'])).toEqual({ privateData: true });
  expect(authApi.logout).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});

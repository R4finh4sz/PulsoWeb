import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Registration } from '@/components/screens/Registration';
import { authApi } from '@/integrations/auth/api';
import { registrationApi } from '@/integrations/registration/api';
import { queryWrapper, router } from '../helpers';
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/' }));
jest.mock('@/integrations/auth/api', () => ({ authApi: { terms: jest.fn() } }));
jest.mock('@/integrations/registration/api', () => ({ registrationApi: { schools: jest.fn(), invitation: jest.fn(), verify: jest.fn(), resend: jest.fn(), complete: jest.fn(), register: jest.fn() } }));
const invitation = { email: 'a@b.com', schoolName: 'Escola', role: 'TEACHER' as const, verified: true, expiresAt: '2099-01-01', resendAvailableAt: '1970-01-01T00:00:00Z' };
beforeEach(() => {
  jest.mocked(authApi.terms).mockResolvedValue({ title: 'Termos', content: 'Texto', version: '1' });
  jest.mocked(registrationApi.schools).mockResolvedValue({ content: [{ id: '1', name: 'Escola', city: 'SP', state: 'SP' }], totalPages: 1 });
  jest.mocked(registrationApi.invitation).mockResolvedValue(invitation);
  jest.mocked(registrationApi.register).mockResolvedValue({ id: 1, status: 'PENDING' });
  jest.mocked(registrationApi.complete).mockResolvedValue({}); jest.mocked(registrationApi.verify).mockResolvedValue(invitation); jest.mocked(registrationApi.resend).mockResolvedValue(invitation);
});
async function form(token?: string) {
  const view = render(<Registration token={token} />, { wrapper: queryWrapper().wrapper });
  await screen.findByRole('checkbox');
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Silva' } });
  fireEvent.change(screen.getByLabelText('RA / matrícula'), { target: { value: '123' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Password1' } });
  fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value: 'Password1' } });
  if (!token) {
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@b.com' } }); fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '2000-01-01' } });
    await screen.findByRole('option', { name: 'Escola · SP/SP' }); fireEvent.change(screen.getByLabelText('Escola'), { target: { value: '1' } });
  }
  fireEvent.click(screen.getByRole('checkbox'));
  return view;
}
test('cadastro público envia dados, busca escolas e exige aceite', async () => {
  const { container } = await form();
  fireEvent.change(screen.getByLabelText('Buscar escola'), { target: { value: 'Escola' } });
  await screen.findByRole('option', { name: 'Escola · SP/SP' }); fireEvent.change(screen.getByLabelText('Escola'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('checkbox')); expect(screen.getByRole('button', { name: 'Enviar cadastro' })).toBeDisabled();
  fireEvent.submit(container.querySelector('form')!); expect(await screen.findByRole('alert')).toHaveTextContent('aceite');
  fireEvent.click(screen.getByRole('checkbox')); fireEvent.submit(container.querySelector('form')!);
  await screen.findByText('Cadastro enviado');
  expect(registrationApi.register).toHaveBeenCalledWith({ name: 'Ana Silva', ra: '123', password: 'Password1', termsAccepted: true, termsVersion: '1', email: 'a@b.com', birthDate: '2000-01-01', schoolId: 1 }, undefined);
});
test.each([
  ['Nome completo', 'Ana', /sobrenome/], ['Confirme sua senha', 'different', /iguais/], ['Senha', 'é'.repeat(40), /72 bytes/],
] as const)('cadastro rejeita %s inválido', async (label, value, error) => {
  const { container } = await form(); fireEvent.change(screen.getByLabelText(label), { target: { value } });
  if (label === 'Senha') fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value } });
  fireEvent.submit(container.querySelector('form')!); expect(await screen.findByRole('alert')).toHaveTextContent(error); expect(registrationApi.register).not.toHaveBeenCalled();
});
test('convite validado envia dados e valida complexidade da senha', async () => {
  const { container } = await form('token');
  for (const label of ['Senha', 'Confirme sua senha']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'password' } });
  fireEvent.submit(container.querySelector('form')!); expect(await screen.findByRole('alert')).toHaveTextContent('maiúscula');
  for (const label of ['Senha', 'Confirme sua senha']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'Password1' } });
  fireEvent.submit(container.querySelector('form')!); await screen.findByText('Cadastro enviado');
  expect(registrationApi.complete).toHaveBeenCalledWith('token', { name: 'Ana Silva', ra: '123', password: 'Password1', termsAccepted: true, termsVersion: '1' });
});
test.each([new Error('Cadastro negado'), 'failure'])('cadastro mostra erro do servidor: %s', async error => {
  jest.mocked(registrationApi.register).mockRejectedValue(error); const { container } = await form(); fireEvent.submit(container.querySelector('form')!); expect(await screen.findByRole('alert')).toBeVisible();
});
test('cadastro fica indisponível sem termos ou escolas', async () => {
  jest.mocked(authApi.terms).mockResolvedValue(null); jest.mocked(registrationApi.schools).mockResolvedValue({ content: [], totalPages: 0 });
  render(<Registration />, { wrapper: queryWrapper().wrapper }); expect(await screen.findByRole('alert')).toHaveTextContent('termos'); expect(screen.getByRole('button', { name: 'Enviar cadastro' })).toBeDisabled();
  expect(await screen.findByText(/Nenhuma escola encontrada/)).toBeVisible();
});
test('convite inválido mostra erro', async () => {
  jest.mocked(registrationApi.invitation).mockRejectedValue(new Error('Convite expirado'));
  render(<Registration token="expired" />, { wrapper: queryWrapper().wrapper }); expect(await screen.findByRole('alert')).toHaveTextContent('Convite expirado');
});
test('convite verifica email e reenvia código', async () => {
  jest.mocked(registrationApi.invitation).mockResolvedValue({ ...invitation, verified: false });
  jest.mocked(registrationApi.verify).mockRejectedValueOnce(new Error('Código inválido')).mockResolvedValueOnce(invitation);
  const { container } = render(<Registration token="token" />, { wrapper: queryWrapper().wrapper }); await screen.findByText(/Enviamos um código/);
  const digits = screen.getAllByRole('textbox');
  fireEvent.change(digits[0], { target: { value: '1' } }); fireEvent.keyDown(digits[1], { key: 'Backspace' }); expect(digits[0]).toHaveValue('');
  fireEvent.keyDown(digits[0], { key: 'ArrowRight' }); expect(digits[1]).toHaveFocus(); fireEvent.keyDown(digits[1], { key: 'ArrowLeft' });
  fireEvent.paste(digits[0], { clipboardData: { getData: () => '123456' } }); fireEvent.submit(container.querySelector('form')!); await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Reenviar código' })); await waitFor(() => expect(digits[0]).toHaveValue(''));
  fireEvent.change(digits[3], { target: { value: '654321' } }); fireEvent.submit(container.querySelector('form')!); expect(await screen.findByLabelText('Nome completo')).toBeVisible();
});

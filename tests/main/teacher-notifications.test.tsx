import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TeacherNotifications } from '@/components/screens/Dashboard/TeacherNotifications';
import { subjectsApi, type SubjectInvitation } from '@/integrations/subjects/api';
import { queryWrapper } from '../helpers';

jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true, getDemoUser: () => ({ role: 'TEACHER', id: 3 }) }));
jest.mock('@/integrations/subjects/api', () => ({ subjectsApi: { invitations: jest.fn(), respond: jest.fn() } }));
const invite: SubjectInvitation = { id: 1, subjectId: 2, classroomId: 1, subjectName: 'Ciências', inviterName: 'Mariana Souza', email: 'professor@pulso.com', status: 'PENDING' };
beforeEach(() => {
  jest.mocked(subjectsApi.invitations).mockReset().mockResolvedValue([invite]);
  jest.mocked(subjectsApi.respond).mockReset().mockImplementation(async (_id, status) => {
    jest.mocked(subjectsApi.invitations).mockResolvedValue([]);
    return { ...invite, status };
  });
});
async function showNotifications(count = 1) {
  const { client, wrapper } = queryWrapper();
  render(<TeacherNotifications userId="3" />, { wrapper });
  await screen.findByRole('button', { name: count === 1 ? 'Notificações, 1 convite pendente' : 'Notificações, 2 convites pendentes' });
  return client;
}
test('fechar sem responder mantém o convite pendente', async () => {
  await showNotifications();
  fireEvent.click(screen.getByRole('button', { name: /Notificações/ }));
  expect(screen.getByText(/Mariana Souza/)).toHaveTextContent('Ciências');
  fireEvent.click(screen.getByRole('button', { name: /Convite para uma matéria/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Fechar convite' }));
  expect(subjectsApi.respond).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Notificações/ }));
  expect(screen.getByText('Convite para uma matéria')).toBeVisible();
});
test.each([['Aceitar', 'ACCEPTED'], ['Negar', 'REJECTED']] as const)('responde %s pela API e atualiza as matérias', async (action, status) => {
  const client = await showNotifications();
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  fireEvent.click(screen.getByRole('button', { name: /Notificações/ }));
  fireEvent.click(screen.getByRole('button', { name: /Convite para uma matéria/ }));
  fireEvent.click(screen.getByRole('button', { name: action }));
  await waitFor(() => expect(subjectsApi.respond).toHaveBeenCalledWith(1, status));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['subjects'] });
  fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
  expect(await screen.findByText('Nenhum convite pendente')).toBeVisible();
});
test('falha no aceite mantém o diálogo aberto e permite tentar novamente', async () => {
  jest.mocked(subjectsApi.respond).mockRejectedValueOnce(new Error('Falha ao responder convite.'));
  await showNotifications();
  fireEvent.click(screen.getByRole('button', { name: /Notificações/ }));
  fireEvent.click(screen.getByRole('button', { name: /Convite para uma matéria/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao responder convite.');
  expect(screen.getByRole('dialog')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

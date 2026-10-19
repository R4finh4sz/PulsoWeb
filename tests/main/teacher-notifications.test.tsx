import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TeacherNotifications } from '@/components/screens/Dashboard/TeacherNotifications';
import { subjectsApi, type SubjectInvitation } from '@/integrations/subjects/api';
import { queryWrapper } from '../helpers';
import { schoolsApi, type SchoolInvitation } from '@/integrations/schools/api';

jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true, getDemoUser: () => ({ role: 'TEACHER', id: 3 }) }));
jest.mock('@/integrations/subjects/api', () => ({ subjectsApi: { invitations: jest.fn(), respond: jest.fn() } }));
jest.mock('@/integrations/schools/api', () => ({ schoolsApi: { invitations: jest.fn(), respond: jest.fn() } }));
const schoolInvite: SchoolInvitation = { id: 1, schoolId: 4, schoolName: 'EMEF Parque das Árvores', inviterName: 'Coordenação da escola', email: 'professor@pulso.com', status: 'PENDING' };
const invite: SubjectInvitation = { id: 1, subjectId: 2, classroomId: 1, subjectName: 'Ciências', inviterName: 'Mariana Souza', email: 'professor@pulso.com', status: 'PENDING' };
beforeEach(() => {
  jest.mocked(schoolsApi.invitations).mockReset().mockResolvedValue([]);
  jest.mocked(schoolsApi.respond).mockReset().mockImplementation(async (_id, status) => {
    jest.mocked(schoolsApi.invitations).mockResolvedValue([]);
    return { ...schoolInvite, status };
  });
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

test.each([['Aceitar', 'ACCEPTED'], ['Negar', 'REJECTED']] as const)('convite de escola responde %s sem confundir IDs com convites de matéria', async (action, status) => {
  jest.mocked(schoolsApi.invitations).mockResolvedValue([schoolInvite]);
  const client = await showNotifications(2);
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  fireEvent.click(screen.getByRole('button', { name: /Notificações/ }));
  expect(screen.getByText('Convite para uma matéria')).toBeVisible();
  expect(screen.getByText('Convite para uma escola')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Convite para uma escola/ }));
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent('EMEF Parque das Árvores');
  expect(dialog.querySelectorAll(':scope > div')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: action }));
  await waitFor(() => expect(schoolsApi.respond).toHaveBeenCalledWith(1, status));
  expect(subjectsApi.respond).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['schools'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['teacher-profile'] });
  fireEvent.click(screen.getByRole('button', { name: 'Notificações, 1 convite pendente' }));
  expect(screen.getByText('Convite para uma matéria')).toBeVisible();
  expect(screen.queryByText('Convite para uma escola')).not.toBeInTheDocument();
});

test('erro ao responder escola aparece dentro da modal e permite nova tentativa', async () => {
  jest.mocked(schoolsApi.invitations).mockResolvedValue([schoolInvite]);
  jest.mocked(schoolsApi.respond).mockRejectedValueOnce(new Error('Falha no convite da escola.'));
  await showNotifications(2);
  fireEvent.click(screen.getByRole('button', { name: /Notificações/ }));
  fireEvent.click(screen.getByRole('button', { name: /Convite para uma escola/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent('Falha no convite da escola.');
  const dialog = screen.getByRole('dialog');
  const panel = dialog.querySelector(':scope > div');
  expect(panel).toContainElement(error);
  expect(dialog.querySelectorAll(':scope > div')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

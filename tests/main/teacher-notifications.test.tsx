import { fireEvent, render, screen } from '@testing-library/react';
import { TeacherNotifications } from '@/components/screens/Dashboard/TeacherNotifications';
import { useNotificationStore } from '@/store/notificationStore';

jest.mock('@/mocks/access', () => ({ mockAccessEnabled: true, getDemoUser: () => ({ role: 'TEACHER' }) }));
beforeEach(() => useNotificationStore.setState({ responses: {} }));

test('fechar sem responder mantém convite pendente e não mostra lida', () => {
  render(<TeacherNotifications userId="3" />);
  fireEvent.click(screen.getByRole('button', { name: 'Notificações, 1 convite pendente' }));
  expect(screen.getByText('Convite para uma matéria')).toBeVisible();
  expect(screen.getByText(/Mariana Souza/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Convite para uma matéria/ }));
  expect(screen.getByRole('dialog')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Fechar convite' }));
  fireEvent.click(screen.getByRole('button', { name: 'Notificações, 1 convite pendente' }));
  expect(screen.getByText('Convite para uma matéria')).toBeVisible();
  expect(screen.queryByText('Lida')).not.toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('region', { name: 'Notificações do professor' })).not.toBeInTheDocument();
});

test.each([['Aceitar', 'ACCEPTED'], ['Negar', 'REJECTED']])('responde %s e remove convite da lista', (action, response) => {
  render(<TeacherNotifications userId="3" />);
  fireEvent.click(screen.getByRole('button', { name: /Notificações/ }));
  fireEvent.click(screen.getByRole('button', { name: /Convite para uma matéria/ }));
  fireEvent.click(screen.getByRole('button', { name: action }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(useNotificationStore.getState().responses['3:subject-invitation-demo-1']).toBe(response);
  fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
  expect(screen.queryByRole('button', { name: /Convite para uma matéria/ })).not.toBeInTheDocument();
  expect(screen.getByText('Nenhum convite pendente')).toBeVisible();
});

test('respostas ficam separadas por usuário', () => {
  useNotificationStore.getState().respond('outro', 'subject-invitation-demo-1', 'ACCEPTED');
  render(<TeacherNotifications userId="3" />);
  expect(screen.getByRole('button', { name: 'Notificações, 1 convite pendente' })).toBeVisible();
});

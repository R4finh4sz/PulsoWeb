import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SubjectCard } from '@/components/screens/ClassroomDetails/SubjectCard';
import { queryWrapper } from '../helpers';
import { subjectsApi } from '@/integrations/subjects/api';
jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true, getDemoUser: () => ({ id: 3 }) }));
jest.mock('@/integrations/subjects/api', () => ({ subjectsApi: { invite: jest.fn() } }));

test('menu abre convite separado do link da matéria e registra o professor convidado', async () => {
  jest.mocked(subjectsApi.invite).mockResolvedValue({ id: 1, subjectId: 1, email: 'prof@escola.com', status: 'PENDING' });
  render(<SubjectCard subject={{ id: 1, name: 'Matemática', classroomId: 1, teacherId: 3 }} />, { wrapper: queryWrapper().wrapper });
  expect(screen.getByRole('link')).toHaveAttribute('href', '/teacher/classrooms/1/subjects/1');
  fireEvent.click(screen.getByLabelText('Opções de Matemática'));
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar professor' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail do professor' }), { target: { value: 'prof@escola.com' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Convidar professor' }).closest('form')!);
  await waitFor(() => expect(subjectsApi.invite).toHaveBeenCalledWith(1, 1, 'prof@escola.com'));
  expect(await screen.findByRole('status')).toHaveTextContent('Convite criado');
});

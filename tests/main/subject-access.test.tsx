import { render, screen, waitFor, act } from '@testing-library/react';
import { SubjectQuizzes } from '@/components/screens/SubjectQuizzes';
import { subjectsApi } from '@/integrations/subjects/api';
import { quizzesApi } from '@/integrations/quizzes/api';
import { queryWrapper, router } from '../helpers';

jest.mock('next/navigation', () => ({ useRouter: () => router }));
jest.mock('@/mocks/access', () => ({ ...jest.requireActual('@/mocks/access'), mockAccessEnabled: true, getDemoUser: () => ({ id: 3 }) }));
jest.mock('@/integrations/subjects/api', () => ({ subjectsApi: { list: jest.fn() } }));
jest.mock('@/integrations/quizzes/api', () => ({ quizzesApi: { list: jest.fn(), themes: jest.fn(), create: jest.fn() } }));
jest.mock('@/integrations/classrooms/hooks', () => ({ useClassroom: () => ({ data: { id: 1, name: '6º ano A' }, isPending: false, error: null }) }));
jest.mock('@/components/screens/Dashboard/TeacherShell', () => ({ TeacherShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/components/screens/Integration/shared', () => ({
  ...jest.requireActual('@/components/screens/Integration/shared'),
  Protected: ({ children }: { children: (user: { id: string; name: string; email: string; role: 'professor' }) => React.ReactNode }) => children({ id: '3', name: 'Paulo Professor', email: 'professor@pulso.com', role: 'professor' }),
}));

test('URL direta não consulta quizzes bloqueados e só libera após atualizar o vínculo aceito', async () => {
  const subject = { id: 2, name: 'Ciências', classroomId: 1, teacherId: 5, teacherIds: [5] };
  jest.mocked(subjectsApi.list).mockResolvedValue([subject]);
  jest.mocked(quizzesApi.list).mockResolvedValue([]);
  jest.mocked(quizzesApi.themes).mockResolvedValue(['Corpo humano']);
  const { client, wrapper } = queryWrapper();
  render(<SubjectQuizzes classroomId={1} subjectId={2} />, { wrapper });
  expect(await screen.findByRole('alert')).toHaveTextContent('Aceite o convite');
  expect(quizzesApi.list).not.toHaveBeenCalled();
  expect(quizzesApi.themes).not.toHaveBeenCalled();
  jest.mocked(subjectsApi.list).mockResolvedValue([{ ...subject, teacherIds: [5, 3] }]);
  await act(async () => { await client.invalidateQueries({ queryKey: ['subjects'] }); });
  expect(await screen.findByRole('heading', { name: 'Ciências' })).toBeVisible();
  await waitFor(() => expect(quizzesApi.list).toHaveBeenCalledWith(1, 2, expect.any(AbortSignal)));
});

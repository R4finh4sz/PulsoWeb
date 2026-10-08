import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { AddTeachers } from '@/components/screens/ClassroomDetails/AddTeachers';
import { RemoveTeacher } from '@/components/screens/ClassroomDetails/RemoveTeacher';
import { ClassroomCard } from '@/components/screens/Dashboard/ClassroomCard';
import { DashboardShell } from '@/components/screens/Dashboard/DashboardShell';
import { UnavailableSchools } from '@/components/screens/Integration/Unavailable';
import { useTeacherStore } from '@/store/teacherStore';
import { useClassroomStore } from '@/store/classroomStore';
import { classrooms } from '@/mocks/platform';
import { authApi } from '@/integrations/auth/api';
import { queryWrapper, coordinator, teacher, admin, router } from '../helpers';
let pathname = '/coordenador';
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => pathname }));
jest.mock('@/integrations/auth/api', () => ({ authApi: { me: jest.fn(), logout: jest.fn() } }));
beforeEach(() => { pathname = '/coordenador'; useTeacherStore.setState({ teachers: [{ ...teacher, registration: '' }] }); useClassroomStore.setState({ rooms: classrooms }); });
test('adicionar professores exige seleção, permite cancelar e salva', () => {
  render(<AddTeachers user={coordinator} room={{ ...classrooms[0], teacherIds: [] }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar professores' })); fireEvent.click(screen.getByRole('button', { name: 'Salvar vínculos' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Selecione');
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' })); fireEvent.click(screen.getByRole('button', { name: 'Adicionar professores' }));
  fireEvent.click(screen.getByRole('button', { name: 'Professores para adicionar' })); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Salvar vínculos' }));
  expect(screen.getByRole('status')).toHaveTextContent('sucesso');
});
test('adicionar professores bloqueia quando todos estão vinculados e mostra erro de permissão', () => {
  const { rerender } = render(<AddTeachers user={admin} room={classrooms[0]} />); expect(screen.getByRole('button')).toBeDisabled();
  rerender(<AddTeachers user={admin} room={{ ...classrooms[0], teacherIds: [] }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar professores' })); fireEvent.click(screen.getByRole('button', { name: 'Professores para adicionar' })); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Salvar vínculos' })); expect(screen.getByRole('alert')).toBeVisible();
});
test('remover professor confirma, cancela e mostra erro', () => {
  const { rerender } = render(<RemoveTeacher user={coordinator} roomId="class-1" teacher={teacher} />);
  fireEvent.click(screen.getByRole('button', { name: /Remover/ })); expect(screen.getByRole('dialog')).toBeVisible(); fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  fireEvent.click(screen.getByRole('button', { name: /Remover/ })); fireEvent.click(screen.getByRole('button', { name: 'Sim' })); expect(useClassroomStore.getState().rooms[0].teacherIds).toEqual([]);
  rerender(<RemoveTeacher user={admin} roomId="class-1" teacher={teacher} />); fireEvent.click(screen.getByRole('button', { name: /Remover/ })); fireEvent.click(screen.getByRole('button', { name: 'Sim' })); expect(screen.getByRole('alert')).toBeVisible();
});
test('cartão calcula rota e quantidade de professores', () => {
  const { rerender } = render(<ClassroomCard room={classrooms[0]} />); expect(screen.getByRole('link')).toHaveAttribute('href', '/coordenador/turmas/class-1'); expect(screen.getByText('1 professor')).toBeVisible();
  pathname = '/professor'; rerender(<ClassroomCard room={{ ...classrooms[1], teacherIds: [] }} />); expect(screen.getByRole('link')).toHaveAttribute('href', '/professor/turmas/class-2'); expect(screen.getByText('0 professores')).toBeVisible();
});
test('shell acompanha hash e exibe erro de logout', async () => {
  jest.mocked(authApi.logout).mockRejectedValue(new Error('Logout falhou'));
  render(<DashboardShell user={coordinator} title="Painel" description="Descrição" navigation={[{ label: 'Turmas', href: '#rooms', icon: 'book' }, { label: 'Outra', href: '/coordenador#rooms', icon: 'book' }, { label: 'Professores', href: '/old', icon: 'users' }]}><p>Conteúdo</p></DashboardShell>, { wrapper: queryWrapper().wrapper });
  act(() => { window.location.hash = '#rooms'; window.dispatchEvent(new Event('hashchange')); });
  expect(screen.getByRole('link', { name: 'Turmas' })).toHaveAttribute('aria-current', 'location'); expect(screen.getByRole('link', { name: 'Outra' })).toHaveAttribute('aria-current', 'location');
  fireEvent.click(screen.getByRole('button', { name: 'Sair' })); expect(await screen.findByRole('alert')).toHaveTextContent('Logout falhou'); cleanup(); window.location.hash = '';
});
test('tela indisponível explica estado da integração', async () => {
  jest.mocked(authApi.me).mockResolvedValue({ id: 1, fullName: 'Admin', email: 'a@b.com', role: 'ADMIN' } as Awaited<ReturnType<typeof authApi.me>>);
  render(<UnavailableSchools />, { wrapper: queryWrapper().wrapper }); expect(await screen.findByText(/A gestão de escolas ainda/)).toBeVisible();
});

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TeacherForm } from '@/components/screens/CreateTeacher/TeacherForm';
import { CoordinatorForm } from '@/components/screens/CreateCoordinator/CoordinatorForm';
import { StudentForm } from '@/components/screens/CreateStudent/StudentForm';
import { ClassroomForm } from '@/components/screens/CreateClassroom/ClassroomForm';
import { SchoolForm } from '@/components/screens/CreateSchool/SchoolForm';
import { useTeacherStore } from '@/store/teacherStore';
import { useCoordinatorStore } from '@/store/coordinatorStore';
import { useClassroomStore } from '@/store/classroomStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useFeedbackStore } from '@/store/feedbackStore';
import { classrooms, schools } from '@/mocks/platform';
import { classroomsApi } from '@/integrations/classrooms/api';
import { schoolsApi } from '@/integrations/schools/api';
import { findAddressByCep } from '@/utils/viacep';
import { admin, coordinator, teacher, router, queryWrapper, teacherForm, coordinatorForm, studentForm } from '../helpers';
jest.mock('next/navigation', () => ({ useRouter: () => router }));
jest.mock('@/integrations/classrooms/api', () => ({ classroomsApi: { create: jest.fn(), assign: jest.fn() } }));
jest.mock('@/integrations/schools/api', () => ({ schoolsApi: { create: jest.fn() } }));
jest.mock('@/utils/viacep', () => ({ ...jest.requireActual('@/utils/viacep'), findAddressByCep: jest.fn() }));
beforeEach(() => {
  useTeacherStore.setState({ teachers: [{ ...teacher, id: '7', registration: 'orig' }] });
  useCoordinatorStore.setState({ coordinators: [] });
  useClassroomStore.setState({ rooms: classrooms, students: [] }); useSchoolStore.setState({ schools });
  useFeedbackStore.getState().closeFeedback();
});
function fill(values: Record<string, string>, container: HTMLElement) {
  for (const [name, value] of Object.entries(values)) fireEvent.change(container.querySelector(`[name="${name}"]`)!, { target: { value } });
}
test.each([
  [TeacherForm, coordinator, teacherForm, '/coordenador/professores'],
  [CoordinatorForm, admin, coordinatorForm, '/admin#coordinators'],
  [StudentForm, coordinator, studentForm, '/coordenador#students'],
])('formulário valida campos, mostra prévia e salva', async (Component, user, values, route) => {
  const { container } = render(<Component user={user} />);
  fireEvent.submit(container.querySelector('form')!);
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  expect(container.querySelector('[name="name"]')).toHaveFocus();
  fill(values, container);
  expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0);
  fireEvent.submit(container.querySelector('form')!);
  expect(router.push).toHaveBeenCalledWith(route);
  fireEvent.submit(container.querySelector('form')!);
  expect(router.push).toHaveBeenCalledTimes(1);
});
test.each([
  [TeacherForm, admin, teacherForm], [CoordinatorForm, coordinator, coordinatorForm], [StudentForm, admin, studentForm],
])('formulário mostra erro de permissão e limpa ao editar', (Component, user, values) => {
  const { container } = render(<Component user={user} />);
  fill(values, container); fireEvent.submit(container.querySelector('form')!);
  expect(screen.getByRole('alert')).toBeVisible();
  fireEvent.change(container.querySelector('[name="name"]')!, { target: { value: 'Outro Nome' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
test('aluno sem turmas não pode salvar', () => {
  useClassroomStore.setState({ rooms: [] }); render(<StudentForm user={coordinator} />);
  expect(screen.getByRole('button', { name: 'Criar aluno' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Crie uma turma' })).toBeVisible();
});
test('turma valida professores, cria e vincula no servidor', async () => {
  jest.mocked(classroomsApi.create).mockResolvedValue({ id: 9 } as Awaited<ReturnType<typeof classroomsApi.create>>);
  jest.mocked(classroomsApi.assign).mockResolvedValue({ id: 9 } as Awaited<ReturnType<typeof classroomsApi.assign>>);
  const { container } = render(<ClassroomForm user={coordinator} />, { wrapper: queryWrapper().wrapper });
  fireEvent.submit(container.querySelector('form')!); expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  fill({ year: '2', identifier: 'b', period: 'Tarde', schoolId: 'school-1' }, container);
  fireEvent.click(screen.getByRole('button', { name: 'Professores' }));
  fireEvent.click(screen.getByRole('checkbox')); fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/coordenador/turmas'));
  expect(classroomsApi.create).toHaveBeenCalledWith({ name: '2º ano · Tarde', identifier: 'B' });
  expect(classroomsApi.assign).toHaveBeenCalledWith(9, 7);
});
test('turma permite tentar novamente após falha e bloqueia sem escola', async () => {
  jest.mocked(classroomsApi.create).mockRejectedValue(new Error('offline'));
  const { container } = render(<ClassroomForm user={coordinator} />, { wrapper: queryWrapper().wrapper });
  fill({ year: '2', identifier: 'A' }, container);
  fireEvent.click(screen.getByRole('button', { name: 'Professores' })); fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Criar turma' })).toBeEnabled());
  cleanup(); useSchoolStore.setState({ schools: [] });
  render(<ClassroomForm user={coordinator} />, { wrapper: queryWrapper().wrapper });
  expect(screen.getByRole('button', { name: 'Criar turma' })).toBeDisabled();
});
test('escola consulta CEP, trava endereço encontrado e salva payload', async () => {
  jest.mocked(findAddressByCep).mockResolvedValue({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' });
  jest.mocked(schoolsApi.create).mockResolvedValue({ id: 1 } as Awaited<ReturnType<typeof schoolsApi.create>>);
  const { container } = render(<SchoolForm />);
  fireEvent.submit(container.querySelector('form')!); expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  expect(screen.getByLabelText('Logradouro')).toBeDisabled();
  fill({ name: 'Escola Teste', cnpj: '11222333000181', cep: '01001000' }, container);
  await waitFor(() => expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo'));
  expect(screen.getByLabelText('Cidade')).toBeDisabled();
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(useFeedbackStore.getState().feedback?.type).toBe('success'));
  expect(schoolsApi.create).toHaveBeenCalledWith({ nome: 'Escola Teste', cnpj: '11222333000181', logradouro: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo' });
});
test.each([null, new Error('CEP indisponível'), {}])('CEP ausente ou incompleto habilita edição manual: %s', async address => {
  if (address instanceof Error) jest.mocked(findAddressByCep).mockRejectedValue(address);
  else jest.mocked(findAddressByCep).mockResolvedValue(address);
  jest.mocked(schoolsApi.create).mockRejectedValue(new Error('Servidor indisponível'));
  const { container } = render(<SchoolForm />);
  fill({ name: 'Escola Teste', cnpj: '11222333000181', cep: '01001000' }, container);
  await waitFor(() => expect(screen.getByLabelText('Logradouro')).toBeEnabled());
  fill({ street: 'Rua Teste', neighborhood: 'Centro', state: 'SP', city: 'São Paulo' }, container);
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(useFeedbackStore.getState().feedback?.message).toBe('Servidor indisponível'));
  expect(screen.getByRole('button', { name: 'Criar escola' })).toBeEnabled();
  fill({ cep: '123' }, container); expect(screen.getByLabelText('Logradouro')).toBeDisabled();
});

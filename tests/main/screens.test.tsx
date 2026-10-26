import AdminRoomRoute from "@/app/admin/classrooms/[id]/page";
import AdminNewRoomRoute from "@/app/admin/classrooms/new/page";
import CoordinatorsPage from "@/app/admin/coordinators/page";
import AdminDashboard from "@/app/admin/page";
import SchoolRoute from "@/app/admin/schools/[id]/page";
import CreateSchool from "@/app/admin/schools/new/page";
import SchoolsPage from "@/app/admin/schools/page";
import EditTermsRoute from "@/app/admin/terms/edit/page";
import AdminTermsRoute from "@/app/admin/terms/page";
import CoordinatorRoomRoute from "@/app/coordinator/classrooms/[id]/page";
import CoordinatorNewRoomRoute from "@/app/coordinator/classrooms/new/page";
import TeachersPage from "@/app/coordinator/teachers/page";
import CoordinatorTermsRoute from "@/app/coordinator/terms/page";
import StudentRoomRoute from "@/app/student/classrooms/[id]/page";
import StudentTermsRoute from "@/app/student/terms/page";
import TeacherRoomRoute from "@/app/teacher/classrooms/[id]/page";
import TeacherTermsRoute from "@/app/teacher/terms/page";
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { routeFixture, routeParams } from "../route-fixture";



import { ClassroomList } from '@/components/screens/Integration/Classrooms';
import { UserForm, UserList, UsersHome } from '@/components/screens/Integration/Users';


import { ApiError } from '@/api/client';
import { ErrorMessage, Protected } from '@/components/screens/Integration/shared';
import { authApi } from '@/integrations/auth/api';
import { classroomsApi } from '@/integrations/classrooms/api';
import { schoolsApi } from '@/integrations/schools/api';
import { subjectsApi } from '@/integrations/subjects/api';
import { usersApi } from '@/integrations/users/api';
import { useFeedbackStore } from '@/store/feedbackStore';
import { findAddressByCep } from '@/utils/viacep';
import { admin, coordinator, queryWrapper, router, teacher } from '../helpers';
let pathname = '/admin';
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => pathname }));
jest.mock('@/integrations/auth/api', () => ({ authApi: { me: jest.fn(), logout: jest.fn(), terms: jest.fn(), createTerms: jest.fn(), updateTerms: jest.fn() } }));
jest.mock('@/integrations/users/api', () => ({ usersApi: { list: jest.fn(), create: jest.fn(), update: jest.fn() } }));
jest.mock('@/integrations/schools/api', () => ({ schoolsApi: { list: jest.fn() } }));
jest.mock('@/integrations/classrooms/api', () => ({ classroomsApi: { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), students: jest.fn(), teachers: jest.fn(), enroll: jest.fn(), unenroll: jest.fn(), assign: jest.fn(), unassign: jest.fn() } }));
jest.mock('@/integrations/subjects/api', () => ({ subjectsApi: { list: jest.fn(), create: jest.fn() } }));
jest.mock('@/utils/viacep', () => ({ ...jest.requireActual('@/utils/viacep'), findAddressByCep: jest.fn() }));
const school = { id: 1, nome: 'Escola Horizonte', cnpj: '11.222.333/0001-81', cidade: 'São Paulo', logradouro: 'Rua Teste', bairro: 'Centro', coordinator: { id: 2, fullName: 'Maria Costa', email: 'm@b.com' } };
const person = { id: 3, fullName: 'Ana Silva', email: 'a@b.com', ra: '123', role: 'STUDENT' as const, classroomId: null, schoolId: 1 };
const room = { id: 1, name: '3º ano', identifier: 'A', teacherIds: [4] };
function identity(role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PEDAGOGICAL_COORDINATOR' = 'ADMIN') {
  jest.mocked(authApi.me).mockResolvedValue({ ...person, role } as Awaited<ReturnType<typeof authApi.me>>);
}
function show(ui: React.ReactNode) { return render(ui, { wrapper: queryWrapper().wrapper }); }
function formValues(container: HTMLElement, values: Record<string, string>) {
  for (const [name, value] of Object.entries(values)) fireEvent.change(container.querySelector(`[name="${name}"]`)!, { target: { value } });
}
beforeEach(() => {
  pathname = '/admin'; identity();
  jest.mocked(schoolsApi.list).mockResolvedValue([school]);
  jest.mocked(usersApi.list).mockResolvedValue({ content: [person], totalElements: 12, totalPages: 2, page: 0, size: 10 });
  jest.mocked(usersApi.create).mockResolvedValue(person as Awaited<ReturnType<typeof usersApi.create>>);
  jest.mocked(usersApi.update).mockResolvedValue(person as Awaited<ReturnType<typeof usersApi.update>>);
  jest.mocked(classroomsApi.list).mockResolvedValue([room] as Awaited<ReturnType<typeof classroomsApi.list>>);
  jest.mocked(classroomsApi.get).mockResolvedValue(room as Awaited<ReturnType<typeof classroomsApi.get>>);
  jest.mocked(classroomsApi.students).mockResolvedValue([person] as Awaited<ReturnType<typeof classroomsApi.students>>);
  jest.mocked(classroomsApi.teachers).mockResolvedValue([person] as Awaited<ReturnType<typeof classroomsApi.teachers>>);
  jest.mocked(classroomsApi.create).mockResolvedValue(room as Awaited<ReturnType<typeof classroomsApi.create>>);
  jest.mocked(classroomsApi.update).mockResolvedValue(room as Awaited<ReturnType<typeof classroomsApi.update>>);
  jest.mocked(classroomsApi.enroll).mockResolvedValue(person as Awaited<ReturnType<typeof classroomsApi.enroll>>);
  jest.mocked(classroomsApi.assign).mockResolvedValue(room as Awaited<ReturnType<typeof classroomsApi.assign>>);
  jest.mocked(classroomsApi.unenroll).mockResolvedValue(); jest.mocked(classroomsApi.unassign).mockResolvedValue();
  jest.mocked(subjectsApi.list).mockResolvedValue([{ id: 1, name: 'Matemática' }] as Awaited<ReturnType<typeof subjectsApi.list>>);
  jest.mocked(subjectsApi.create).mockResolvedValue({ id: 2, name: 'História' } as Awaited<ReturnType<typeof subjectsApi.create>>);
  jest.mocked(authApi.terms).mockResolvedValue({ title: 'Termos publicados', version: '1', content: 'Texto vigente' });
  jest.mocked(authApi.createTerms).mockResolvedValue({ title: 'Novo', version: '2', content: 'Texto' });
  jest.mocked(authApi.updateTerms).mockResolvedValue({ title: 'Novo', version: '2', content: 'Texto' });
  jest.mocked(authApi.logout).mockResolvedValue(); useFeedbackStore.getState().closeFeedback();
});
test('escolas filtram nome e CNPJ, mostram vínculo e link de detalhes', async () => {
  show(<SchoolsPage />); expect(await screen.findByText('Escola Horizonte')).toBeVisible();
  expect(screen.getByText('Maria Costa')).toBeVisible();
  const search = screen.getByRole('searchbox');
  for (const value of ['horizonte', '11222333', '11.222']) { fireEvent.change(search, { target: { value } }); expect(screen.getByText('Escola Horizonte')).toBeVisible(); }
  fireEvent.change(search, { target: { value: 'ausente' } }); expect(screen.getByText(/Nenhuma escola encontrada/)).toBeVisible();
});
test.each([{ data: [] }, { data: [{ ...school, cidade: '', cnpj: '', coordinator: null }] }])('escolas tratam ausência de cadastros/dados: %s', async ({ data }) => {
  jest.mocked(schoolsApi.list).mockResolvedValue(data); show(<SchoolsPage />);
  expect(await screen.findByText(data.length ? 'Coordenação não informada' : 'Nenhum cadastro encontrado.')).toBeVisible();
});
test('escolas exibem erro', async () => {
  const { client, wrapper } = queryWrapper();
  client.setQueryData(['session'], { ...person, role: 'ADMIN' });
  jest.mocked(schoolsApi.list).mockRejectedValue(new Error('Escolas offline'));
  render(<SchoolsPage />, { wrapper });
  expect(await screen.findByRole('alert')).toHaveTextContent('Escolas offline');
});
test('detalhes de escola mostram dados e escola inexistente', async () => {
  show(<SchoolDetails id="1" />); expect(await screen.findByText('Maria Costa')).toBeVisible(); expect(screen.getByText('Rua Teste')).toBeVisible();
  cleanup(); show(<SchoolDetails id="9" />); expect(await screen.findByText('Escola não encontrada')).toBeVisible();
});
test('detalhes tratam campos vazios, coordenação ausente e erro de consulta', async () => {
  jest.mocked(schoolsApi.list).mockResolvedValue([{ ...school, coordinator: null, logradouro: '' }]); show(<SchoolDetails id="1" />);
  expect(await screen.findByText('Nenhum coordenador vinculado.')).toBeVisible(); cleanup();
  jest.mocked(schoolsApi.list).mockRejectedValue(new Error('offline')); show(<SchoolDetails id="1" />); expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
});
test('dashboard mostra métricas e logout', async () => {
  show(<AdminDashboard />); expect(await screen.findByText('100%')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Sair' })); await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
});
test('criação de escola exibe formulário e navegação', async () => {
  show(<CreateSchool />); expect(await screen.findByLabelText('CNPJ')).toBeVisible(); expect(screen.getByRole('button', { name: 'Voltar' })).toBeVisible();
});
test.each(['students', 'teachers', 'coordinators'] as const)('cria usuário %s com dados corretos', async resource => {
  const done = jest.fn(); const { container } = show(<UserForm resource={resource} onDone={done} />);
  formValues(container, { fullName: ' Ana Silva ', email: 'a@b.com', ra: '123' });
  if (resource === 'coordinators') { await screen.findByRole('option', { name: 'Escola Horizonte' }); fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } }); }
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(done).toHaveBeenCalled());
  expect(usersApi.create).toHaveBeenCalledWith(resource, { fullName: 'Ana Silva', email: 'a@b.com', ra: '123', schoolId: resource === 'coordinators' ? 1 : undefined });
});
test('coordenador exige escola e permite filtrar por CNPJ e CEP', async () => {
  jest.mocked(findAddressByCep).mockResolvedValue({ logradouro: 'Rua Teste', bairro: 'Centro', localidade: 'São Paulo' });
  const { container } = show(<UserForm resource="coordinators" />);
  fireEvent.submit(container.querySelector('form')!); expect(useFeedbackStore.getState().feedback?.type).toBe('error');
  await screen.findByRole('option', { name: 'Escola Horizonte' });
  fireEvent.change(screen.getByLabelText('Buscar escola por CNPJ'), { target: { value: '999' } }); expect(screen.getByText('Nenhuma escola encontrada para a busca.')).toBeVisible();
  fireEvent.change(screen.getByLabelText('Buscar escola por CNPJ'), { target: { value: '11222' } });
  fireEvent.change(screen.getByLabelText('Buscar escola por CEP'), { target: { value: '01001000' } }); await waitFor(() => expect(findAddressByCep).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole('option', { name: 'Escola Horizonte' })).toBeVisible());
});
test.each([null, new Error('offline')])('busca CEP de coordenador permite seleção manual: %s', async result => {
  if (result instanceof Error) jest.mocked(findAddressByCep).mockRejectedValue(result); else jest.mocked(findAddressByCep).mockResolvedValue(result);
  show(<UserForm resource="coordinators" />);
  fireEvent.change(screen.getByLabelText('Buscar escola por CEP'), { target: { value: '01' } });
  fireEvent.change(screen.getByLabelText('Buscar escola por CEP'), { target: { value: '01001000' } }); expect(await screen.findByText(/CEP não encontrado/)).toBeVisible();
});
test('formulário preserva dados ao falhar e lista permite editar/cancelar', async () => {
  const { container } = show(<UserList resource="students" />); await screen.findByText('Ana Silva');
  fireEvent.click(screen.getByRole('checkbox')); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ana' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Próxima' })); await waitFor(() => expect(usersApi.list).toHaveBeenLastCalledWith('students', expect.objectContaining({ page: 1, unassigned: true }), expect.any(AbortSignal)));
  fireEvent.click(await screen.findByRole('button', { name: 'Anterior' }));
  fireEvent.click(await screen.findByRole('button', { name: /Editar cadastro de/ }));
  jest.mocked(usersApi.update).mockRejectedValueOnce(new Error('Falha ao salvar'));
  fireEvent.submit(container.querySelector('form')!); await waitFor(() => expect(useFeedbackStore.getState().feedback?.message).toBe('Falha ao salvar'));
  expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Silva');
  expect(screen.queryByText(/senha de acesso.*enviada/i)).not.toBeInTheDocument();
  fireEvent.submit(container.querySelector('form')!); await waitFor(() => expect(screen.queryByLabelText('Nome completo')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: /Editar cadastro de/ })); fireEvent.click(screen.getByRole('button', { name: 'Cancelar edição' })); expect(screen.queryByLabelText('Nome completo')).toBeNull();
});
test('lista mostra vazio, nenhum resultado e erros', async () => {
  jest.mocked(usersApi.list).mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 });
  show(<UserList resource="teachers" />); await screen.findByText('Nenhum cadastro encontrado.');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ausente' } }); await screen.findByText('Nenhum cadastro encontrado para esta busca.');
  cleanup(); jest.mocked(usersApi.list).mockRejectedValue(new Error('Pessoas offline')); show(<UserList resource="teachers" />); expect(await screen.findByRole('alert')).toHaveTextContent('Pessoas offline');
});
test('páginas de pessoas respeitam papel', async () => {
  show(<CoordinatorsPage />); expect(await screen.findByRole('link', { name: 'Convidar coordenador' })).toBeVisible(); cleanup();
  identity('PEDAGOGICAL_COORDINATOR'); show(<TeachersPage />); expect(await screen.findByRole('link', { name: 'Convidar professor' })).toBeVisible(); cleanup();
  show(<UsersHome user={teacher} />); expect(screen.queryByRole('heading')).toBeNull(); cleanup();
  show(<UsersHome user={admin} />); expect(await screen.findByRole('heading', { name: 'Coordenadores' })).toBeVisible(); cleanup();
  show(<UsersHome user={coordinator} />); expect(await screen.findByRole('heading', { name: 'Alunos' })).toBeVisible();
});
test.each(['admin', 'coordenador', 'professor', 'aluno'] as const)('listagem mostra turmas para %s', async role => {
  identity(({ admin: 'ADMIN', coordenador: 'PEDAGOGICAL_COORDINATOR', professor: 'TEACHER', aluno: 'STUDENT' } as const)[role]);
  show(<ClassroomList user={{ ...admin, role }} />); expect(await screen.findByText(role === 'professor' ? '3º ano' : '3º ano · A')).toBeVisible();
});
test('listagem vazia e erro de turmas', async () => {
  jest.mocked(classroomsApi.list).mockResolvedValue([]); show(<ClassroomList user={admin} />); await screen.findByText('Nenhuma turma disponível.'); cleanup();
  jest.mocked(classroomsApi.list).mockRejectedValue(new Error('Turmas offline')); show(<ClassroomList user={admin} />); expect(await screen.findByRole('alert')).toHaveTextContent('Turmas offline');
});
test('edição da turma mantém identificador do backend somente para leitura e não o envia', async () => {
  identity('PEDAGOGICAL_COORDINATOR');
  const { container } = show(<ClassroomDetailsPage role="coordenador" id="1" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Dados da turma' }));
  expect(screen.getByLabelText('Identificador')).toHaveAttribute('readonly');
  expect(screen.getByLabelText('Identificador')).toBeDisabled();
  expect(screen.getByLabelText('Identificador')).toHaveValue('A');
  fireEvent.change(screen.getByLabelText('Nome da turma'), { target: { value: '1º ano A' } });
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(classroomsApi.update).toHaveBeenCalledWith(1, { name: '1º ano A' }));
});
test('criação de turma salva e oferece vínculo', async () => {
  identity('PEDAGOGICAL_COORDINATOR'); const { container } = show(<NewClassroomPage />);
  await screen.findByLabelText('Nome da turma'); formValues(container, { name: ' 3º ano ', identifier: 'A' }); fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByRole('link', { name: 'Turma criada. Vincular alunos e professores' })).toHaveAttribute('href', '/coordinator/classrooms/1');
  expect(classroomsApi.create).toHaveBeenCalledWith({ name: '3º ano', identifier: 'A' });
});
test('erro na criação da turma mantém formulário', async () => {
  jest.mocked(classroomsApi.create).mockRejectedValue(new Error('Falha')); const { container } = show(<NewClassroomPage role="admin" />);
  await screen.findByLabelText('Nome da turma'); fireEvent.submit(container.querySelector('form')!); expect(await screen.findByRole('alert')).toHaveTextContent('Falha');
});
test('detalhes inválidos e indisponíveis mostram erro', async () => {
  show(<ClassroomDetailsPage id="bad" role="admin" />); expect(await screen.findByRole('alert')).toHaveTextContent('Identificador'); cleanup();
  jest.mocked(classroomsApi.get).mockRejectedValue(new Error('Turma inexistente')); show(<ClassroomDetailsPage id="1" role="admin" />); expect(await screen.findByRole('alert')).toHaveTextContent('Turma inexistente');
});
test('gestor edita turma, vincula e desvincula alunos e professores', async () => {
  const { container } = show(<ClassroomDetailsPage id="1" role="admin" />); await screen.findByLabelText('Nome da turma');
  fireEvent.submit(container.querySelector('form')!); await screen.findByText('Turma salva.'); expect(classroomsApi.update).toHaveBeenCalledWith(1, { name: '3º ano' });
  for (const title of ['Professores vinculados', 'Alunos vinculados']) {
    const section = screen.getByRole('heading', { name: title }).closest('section')!; const scope = within(section);
    await scope.findByRole('option', { name: /Ana Silva/ });
    fireEvent.change(scope.getByLabelText('Buscar pessoa por nome ou RA'), { target: { value: 'Ana' } });
    await scope.findByRole('option', { name: /Ana Silva/ });
    fireEvent.click(scope.getByRole('button', { name: 'Próxima' }));
    await scope.findByRole('option', { name: /Ana Silva/ });
    fireEvent.click(scope.getByRole('button', { name: 'Anterior' }));
    await scope.findByRole('option', { name: /Ana Silva/ });
    fireEvent.change(scope.getByRole('combobox', { name: 'Selecionar pessoa' }), { target: { value: '3' } }); fireEvent.submit(section.querySelector('form')!); await scope.findByText('Vínculo salvo.');
    fireEvent.click(scope.getByRole('button', { name: /^Desvincular/ }));
    const confirmation = screen.getByRole('dialog', { name: 'Desvincular da turma?' });
    expect(within(confirmation).getByRole('button', { name: 'Sim, desvincular' })).toHaveClass('bg-[#e83e32]');
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Sim, desvincular' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Desvincular da turma?' })).toBeNull());
  }
  await waitFor(() => expect(classroomsApi.unenroll).toHaveBeenCalledWith(1, 3));
  expect(classroomsApi.unassign).toHaveBeenCalledWith(1, 3); expect(classroomsApi.assign).toHaveBeenCalledWith(1, 3); expect(classroomsApi.enroll).toHaveBeenCalledWith(1, 3);
});
test('professor abre a tela de criar disciplina e aluno vê apenas disciplinas', async () => {
  identity('TEACHER'); show(<ClassroomDetailsPage id="1" role="professor" />);
  expect(await screen.findByRole('link', { name: 'Criar nova matéria' })).toHaveAttribute('href', '/teacher/classrooms/1/subjects/new');
  expect(screen.queryByLabelText('Nome da disciplina')).toBeNull(); cleanup();
  identity('STUDENT'); show(<ClassroomDetailsPage id="1" role="aluno" />); await screen.findByText('Matemática'); expect(screen.queryByText('Alunos vinculados')).toBeNull();
});
test('detalhes tratam listas vazias e falhas de mutação', async () => {
  jest.mocked(classroomsApi.students).mockResolvedValue([]); jest.mocked(classroomsApi.teachers).mockResolvedValue([]); jest.mocked(subjectsApi.list).mockResolvedValue([]);
  jest.mocked(classroomsApi.assign).mockRejectedValue(new Error('Vínculo negado'));
  show(<ClassroomDetailsPage id="1" role="admin" />); await screen.findByText('Nenhuma disciplina cadastrada.'); expect(screen.getByText('Nenhum vínculo cadastrado.')).toBeVisible(); expect(screen.getByText('Nenhum aluno vinculado à turma.')).toBeVisible();
  const section = screen.getByRole('heading', { name: 'Professores vinculados' }).closest('section')!;
  fireEvent.change(within(section).getByRole('combobox'), { target: { value: '3' } }); fireEvent.submit(section.querySelector('form')!); expect(await screen.findByRole('alert')).toHaveTextContent('Vínculo negado');
});
test.each(['admin', 'professor'] as const)('termos exibe conteúdo para %s', async role => {
  identity(role === 'admin' ? 'ADMIN' : 'TEACHER'); show(<TermsScreen role={role} />); expect(await screen.findByText('Texto vigente')).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Editar termos' }) !== null).toBe(role === 'admin');
});
test.each(['admin', 'aluno'] as const)('termos ausentes para %s', async role => {
  identity(role === 'admin' ? 'ADMIN' : 'STUDENT'); jest.mocked(authApi.terms).mockResolvedValue(null); show(<TermsScreen role={role} />); await screen.findByText('Nenhum termo de uso cadastrado.');
});
test.each([true, false])('editor publica termos novos/existentes: %s', async existing => {
  if (!existing) jest.mocked(authApi.terms).mockResolvedValue(null);
  const { container } = show(<TermsScreen role="admin" edit />); await screen.findByLabelText('Título');
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: ' ' } }); fireEvent.submit(container.querySelector('form')!); expect(screen.getByRole('alert')).toHaveTextContent('Preencha');
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: ' Novo ' } }); fireEvent.change(screen.getByLabelText('Conteúdo dos termos'), { target: { value: ' Texto ' } }); fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/terms'));
  expect(existing ? authApi.updateTerms : authApi.createTerms).toHaveBeenCalledWith({ title: 'Novo', content: 'Texto' });
});
test('termos permite tentar novamente após falha de consulta e mostra falha na publicação', async () => {
  jest.mocked(authApi.terms).mockRejectedValueOnce(new Error('Termos offline')).mockResolvedValue({ title: 'Termos', content: 'Texto', version: '1' });
  const { container } = show(<TermsScreen role="admin" edit />); expect(await screen.findByRole('alert')).toHaveTextContent('Termos offline');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByLabelText('Título');
  jest.mocked(authApi.updateTerms).mockRejectedValue(new Error('Publicação negada')); fireEvent.submit(container.querySelector('form')!); expect(await screen.findByRole('alert')).toHaveTextContent('Publicação negada');
});
test('proteção redireciona visitante e papel incorreto, permite refetch', async () => {
  jest.mocked(authApi.me).mockResolvedValue(null); show(<Protected role="admin">{() => <p>Privado</p>}</Protected>); await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/')); cleanup();
  identity('TEACHER'); show(<Protected role="admin">{() => <p>Privado</p>}</Protected>); await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/teacher')); cleanup();
  jest.mocked(authApi.me).mockRejectedValueOnce(new Error('Perfil offline')); show(<Protected role="admin">{() => <p>Privado</p>}</Protected>); await screen.findByRole('alert'); identity(); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Privado');
});
test('mensagem de erro mostra detalhes da API e fallback', () => {
  const { rerender } = render(<ErrorMessage error={new ApiError(400, 'Inválido', ['Campo ausente'])} />); expect(screen.getByRole('alert')).toHaveTextContent('Campo ausente');
  rerender(<ErrorMessage error="failure" />); expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar'); rerender(<ErrorMessage error={null} />); expect(screen.queryByRole('alert')).toBeNull();
});

const SchoolDetails = routeFixture<{ id: string; }>((props) => (<SchoolRoute params={routeParams({ id: props.id })} />));
const ClassroomDetailsPage = routeFixture<{ id: string; role: import("@/interfaces/auth").UserRole; }>((props) => (props.role === "admin" ? <AdminRoomRoute params={routeParams({ id: props.id })} /> : props.role === "coordenador" ? <CoordinatorRoomRoute params={routeParams({ id: props.id })} /> : props.role === "professor" ? <TeacherRoomRoute params={routeParams({ id: props.id })} /> : <StudentRoomRoute params={routeParams({ id: props.id })} />));
const NewClassroomPage = routeFixture<{ role?: import("@/interfaces/auth").UserRole; }>((props) => (props.role === "admin" ? <AdminNewRoomRoute /> : <CoordinatorNewRoomRoute />));
const TermsScreen = routeFixture<{ role: import("@/interfaces/auth").UserRole; edit?: boolean; }>((props) => (props.edit ? <EditTermsRoute /> : props.role === "admin" ? <AdminTermsRoute /> : props.role === "coordenador" ? <CoordinatorTermsRoute /> : props.role === "professor" ? <TeacherTermsRoute /> : <StudentTermsRoute />));

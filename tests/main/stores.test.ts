import { useSchoolStore } from '@/store/schoolStore';
import { useClassroomStore } from '@/store/classroomStore';
import { useTeacherStore } from '@/store/teacherStore';
import { useCoordinatorStore } from '@/store/coordinatorStore';
import { useFeedbackStore } from '@/store/feedbackStore';
import { schools, classrooms } from '@/mocks/platform';
import { admin, coordinator, schoolForm, teacherForm, coordinatorForm, classroomForm, studentForm } from '../helpers';

beforeEach(() => {
  useSchoolStore.setState({ schools }); useClassroomStore.setState({ rooms: classrooms, students: [] });
  useTeacherStore.setState({ teachers: [{ id: 'teacher-1', ...teacherForm, role: 'professor' }] });
  useCoordinatorStore.setState({ coordinators: [] });
});
test('stores persistem cadastros na sessão', () => {
  useCoordinatorStore.getState().addCoordinator(admin, coordinatorForm);
  expect(useCoordinatorStore.getState().coordinators).toHaveLength(1);
  useSchoolStore.getState().addSchool(admin, schoolForm);
  useSchoolStore.getState().addSchool(admin, { ...schoolForm, cnpj: '00.000.000/0001-91' }, []);
  expect(useSchoolStore.getState().schools).toHaveLength(4);
  useTeacherStore.getState().addTeacher(coordinator, { ...teacherForm, registration: 'other', email: 'other@example.com' });
  expect(useTeacherStore.getState().teachers).toHaveLength(2);
  expect(JSON.parse(sessionStorage.getItem('pulso-demo-schools')!).state.schools).toHaveLength(4);
});
test('store de turmas mantém alunos, contadores e vínculos consistentes', () => {
  useClassroomStore.getState().addClassroom(coordinator, classroomForm);
  useClassroomStore.getState().addStudent(coordinator, studentForm);
  expect(useClassroomStore.getState().students).toHaveLength(1);
  expect(useClassroomStore.getState().rooms[0].students).toBe(29);
  useClassroomStore.getState().removeTeacher(coordinator, 'class-1', 'teacher-1');
  expect(useClassroomStore.getState().rooms[0].teacherIds).toEqual([]);
  useClassroomStore.getState().addTeachers(coordinator, 'class-1', ['teacher-1']);
  expect(useClassroomStore.getState().rooms[0].teacherIds).toEqual(['teacher-1']);
});
test('migração atualiza nomes antigos', async () => {
  const migrate = useClassroomStore.persist.getOptions().migrate!;
  const result = await migrate({ rooms: [{ ...classrooms[0], name: '4º ano A' }, { ...classrooms[1], name: '5º ano B' }] }, 0);
  expect(result).toMatchObject({ rooms: [{ name: '1º ano A' }, { name: '2º ano B' }] });
});
test('feedback define títulos e permite fechar', () => {
  const { showFeedback, closeFeedback } = useFeedbackStore.getState();
  showFeedback({ type: 'success', message: 'Salvo' }); expect(useFeedbackStore.getState().feedback?.title).toBe('Sucesso');
  showFeedback({ type: 'error', message: 'Erro' }); expect(useFeedbackStore.getState().feedback?.title).toBe('Dados incorretos');
  showFeedback({ type: 'error', title: 'Título', message: 'Erro' }); expect(useFeedbackStore.getState().feedback?.title).toBe('Título');
  closeFeedback(); expect(useFeedbackStore.getState().feedback).toBeNull();
});

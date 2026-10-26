import { createSchool } from '@/services/schools';
import { createTeacher } from '@/services/teachers';
import { createCoordinator } from '@/services/coordinators';
import { createStudent } from '@/services/students';
import { createClassroom, addClassroomTeachers, removeClassroomTeacher } from '@/services/classrooms';
import { getSchoolsForUser, getClassroomsForUser, getSubjectsForUser } from '@/services/dashboard';
import { schools, classrooms, mockUsers } from '@/mocks/platform';
import { admin, coordinator, teacher, schoolForm, teacherForm, coordinatorForm, classroomForm, studentForm } from '../helpers';

describe('permissões e cadastros', () => {
  test('escolas normalizam CNPJ, geram iniciais e impedem duplicidade', () => {
    const school = createSchool(admin, schoolForm, schools);
    expect(school).toMatchObject({ cnpj: '11222333000181', initials: 'ET', coordinatorId: null });
    expect(() => createSchool(teacher, schoolForm, [])).toThrow(/administrador/);
    expect(() => createSchool(admin, schoolForm, [school])).toThrow(/CNPJ/);
    expect(() => createSchool(admin, { ...schoolForm, name: '' }, [])).toThrow();
  });
  test('professores normalizam dados e rejeitam matrícula ou email repetidos', () => {
    const person = createTeacher(coordinator, { ...teacherForm, email: ' MARIA@EXAMPLE.COM ' }, []);
    expect(person).toMatchObject({ role: 'professor', email: 'maria@example.com', registration: 'T-1' });
    expect(() => createTeacher(admin, teacherForm, [])).toThrow(/coordenador/);
    expect(() => createTeacher(coordinator, teacherForm, [person])).toThrow(/matrícula/);
    expect(() => createTeacher(coordinator, { ...teacherForm, registration: 'other' }, [person])).toThrow(/email/);
  });
  test('coordenadores só podem ser criados por administradores', () => {
    const person = createCoordinator(admin, coordinatorForm, []);
    expect(person).toMatchObject({ registration: 'C-1', role: 'coordenador' });
    expect(() => createCoordinator(teacher, coordinatorForm, [])).toThrow(/administrador/);
    expect(() => createCoordinator(admin, coordinatorForm, [person])).toThrow(/matrícula/);
  });
  test('turmas validam escola, professores e ano/identificador repetidos', () => {
    const room = createClassroom(coordinator, classroomForm, classrooms);
    expect(room).toMatchObject({ name: '3º ano C', students: 0, color: 'blue' });
    expect(() => createClassroom(admin, classroomForm, [])).toThrow(/coordenação/);
    expect(() => createClassroom(coordinator, { ...classroomForm, schoolId: 'school-2' }, [])).toThrow();
    expect(() => createClassroom(coordinator, { ...classroomForm, teacherIds: ['admin-1'] }, [])).toThrow(/professor/);
    expect(() => createClassroom(coordinator, classroomForm, [room])).toThrow(/existe/);
  });
  test('vínculos preservam outras turmas e não repetem professores', () => {
    const added = addClassroomTeachers(coordinator, 'class-1', ['teacher-1', 'teacher-2'], classrooms);
    expect(added[0].teacherIds).toEqual(['teacher-1', 'teacher-2']);
    expect(added[1]).toBe(classrooms[1]);
    expect(removeClassroomTeacher(coordinator, 'class-1', 'teacher-1', added)[0].teacherIds).toEqual(['teacher-2']);
    for (const user of [admin, { ...coordinator, id: 'outsider' }]) {
      expect(() => addClassroomTeachers(user, 'class-1', ['teacher-1'], classrooms)).toThrow();
      expect(() => removeClassroomTeacher(user, 'class-1', 'teacher-1', classrooms)).toThrow();
    }
    expect(() => addClassroomTeachers(coordinator, 'missing', ['teacher-1'], classrooms)).toThrow();
    expect(() => removeClassroomTeacher(coordinator, 'missing', 'teacher-1', classrooms)).toThrow();
    expect(() => addClassroomTeachers(coordinator, 'class-1', ['admin-1'], classrooms)).toThrow(/válidos/);
    expect(() => addClassroomTeachers(coordinator, 'class-1', [], classrooms, schools, mockUsers)).toThrow();
  });
  test('alunos não podem duplicar matrícula/email dentro da escola', () => {
    const student = createStudent(coordinator, studentForm, [], classrooms, schools);
    expect(student).toMatchObject(studentForm);
    expect(() => createStudent(admin, studentForm, [], classrooms, schools)).toThrow();
    expect(() => createStudent(coordinator, { ...studentForm, classroomId: 'missing' }, [], classrooms, schools)).toThrow();
    expect(() => createStudent({ ...coordinator, id: 'other' }, studentForm, [], classrooms, schools)).toThrow();
    expect(() => createStudent(coordinator, studentForm, [student], classrooms, schools)).toThrow(/matrícula/);
    expect(() => createStudent(coordinator, { ...studentForm, enrollment: 'other' }, [student], classrooms, schools)).toThrow(/email/);
    expect(createStudent(coordinator, studentForm, [{ ...student, classroomId: 'other-school' }], classrooms, schools)).toHaveProperty('id');
  });
  test('dashboard limita acesso por papel e vínculo', () => {
    expect(getSchoolsForUser(admin)).toEqual(schools);
    expect(getSchoolsForUser(coordinator)).toEqual([schools[0]]);
    expect(getSchoolsForUser(teacher)).toEqual([schools[0]]);
    expect(getSchoolsForUser({ ...teacher, id: 'none' })).toEqual([]);
    expect(getClassroomsForUser(admin)).toEqual(classrooms);
    expect(getClassroomsForUser(coordinator)).toEqual(classrooms);
    expect(getClassroomsForUser(teacher)).toHaveLength(2);
    expect(getSubjectsForUser(admin)).toHaveLength(2);
    expect(getSubjectsForUser(teacher)).toHaveLength(2);
    expect(getSubjectsForUser({ ...teacher, id: 'teacher-2' })).toEqual([]);
  });
});

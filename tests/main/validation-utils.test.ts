import { ClassroomSchema } from '@/validation/Classroom.validation';
import { CoordinatorSchema, isValidBirthDate, isAtLeast18 } from '@/validation/Coordinator.validation';
import { SchoolSchema } from '@/validation/School.validation';
import { StudentSchema } from '@/validation/Student.validation';
import { TeacherSchema } from '@/validation/Teacher.validation';
import { formatCep, findAddressByCep, normalizeCep } from '@/utils/viacep';
import { classroomForm, coordinatorForm, schoolForm, studentForm, teacherForm } from '../helpers';

test.each([
  [ClassroomSchema, classroomForm], [CoordinatorSchema, coordinatorForm], [SchoolSchema, schoolForm],
  [StudentSchema, studentForm], [TeacherSchema, teacherForm],
])('valida formulários completos e rejeita campos ausentes', (schema, form) => {
  expect(schema.safeParse(form).success).toBe(true);
  expect(schema.safeParse({}).success).toBe(false);
});
test('valida professores únicos, estado e formato dos campos', () => {
  expect(ClassroomSchema.safeParse({ ...classroomForm, teacherIds: ['a', 'a'] }).success).toBe(false);
  expect(SchoolSchema.safeParse({ ...schoolForm, state: 'XX', cep: '1' }).success).toBe(false);
  expect(CoordinatorSchema.safeParse({ ...coordinatorForm, name: 'Maria' }).success).toBe(false);
  expect(TeacherSchema.parse({ ...teacherForm, email: ' MARIA@EXAMPLE.COM ' }).email).toBe('maria@example.com');
});
test('datas válidas e limite de 18 anos consideram o aniversário', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 7, 12));
  for (const date of ['bad', '1899-01-01', '2024-02-30', '2099-01-01', '2025-13-01']) expect(isValidBirthDate(date)).toBe(false);
  expect(isValidBirthDate('2000-02-29')).toBe(true);
  expect(isAtLeast18('2008-10-07')).toBe(true);
  expect(isAtLeast18('2008-10-08')).toBe(false);
  expect(isAtLeast18('2008-11-01')).toBe(false);
  expect(isAtLeast18('2008-09-01')).toBe(true);
});
test('formata e normaliza CEP', () => {
  expect(normalizeCep('01001-000')).toBe('01001000');
  expect(formatCep('0100100099')).toBe('01001-000');
  expect(formatCep('abc12')).toBe('12');
});
test('ViaCEP limpa os campos, aceita campos ausentes e propaga erros', async () => {
  const fetchMock = jest.fn(); global.fetch = fetchMock;
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ logradouro: ' Rua ', bairro: ' Sé ', localidade: ' SP ', uf: ' SP ' }) });
  const signal = new AbortController().signal;
  expect(await findAddressByCep('01001000', signal)).toEqual({ logradouro: 'Rua', bairro: 'Sé', localidade: 'SP', uf: 'SP' });
  expect(fetchMock).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/', { signal });
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
  expect(await findAddressByCep('1')).toMatchObject({});
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ erro: true }) });
  expect(await findAddressByCep('1')).toBeNull();
  fetchMock.mockResolvedValueOnce({ ok: false });
  await expect(findAddressByCep('1')).rejects.toThrow(/CEP/);
  fetchMock.mockRejectedValueOnce(new DOMException('abort', 'AbortError'));
  await expect(findAddressByCep('1')).rejects.toHaveProperty('name', 'AbortError');
});

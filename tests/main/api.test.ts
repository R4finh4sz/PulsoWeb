import { apiRequest, ApiError } from '@/api/client';
import { authApi } from '@/integrations/auth/api';
import { classroomsApi } from '@/integrations/classrooms/api';
import { schoolsApi } from '@/integrations/schools/api';
import { usersApi } from '@/integrations/users/api';
import { subjectsApi } from '@/integrations/subjects/api';
import { registrationApi } from '@/integrations/registration/api';
jest.mock('@/api/client', () => ({ ...jest.requireActual('@/api/client'), apiRequest: jest.fn() }));
const request = jest.mocked(apiRequest);
beforeEach(() => request.mockResolvedValue({ id: 1 }));
test.each([
  [() => authApi.login({ email: 'a@b.com', password: 'x' }), '/auth/login', 'POST', { email: 'a@b.com', password: 'x' }],
  [() => authApi.requestPasswordReset('a@b.com'), '/auth/password-reset/request', 'POST', { email: 'a@b.com' }],
  [() => authApi.verifyPasswordReset('a@b.com', '123456'), '/auth/password-reset/verify', 'POST', { email: 'a@b.com', code: '123456' }],
  [() => authApi.resetPassword('a@b.com', '123456', 'new'), '/auth/password-reset/confirm', 'POST', { email: 'a@b.com', code: '123456', password: 'new' }],
  [() => authApi.verify('123456'), '/auth/2fa/verify', 'POST', { code: '123456' }],
  [() => authApi.resend(), '/auth/2fa/resend', 'POST', undefined],
  [() => authApi.createTerms({ title: 'T', content: 'C' }), '/terms', 'POST', { title: 'T', content: 'C' }],
  [() => authApi.updateTerms({ title: 'T', content: 'C' }), '/terms', 'PUT', { title: 'T', content: 'C' }],
  [() => authApi.accept('1'), '/terms/accept', 'POST', { version: '1', termsAccepted: true }],
  [() => authApi.logout(), '/auth/logout', 'POST', undefined],
  [() => classroomsApi.create({ name: '3º ano', identifier: 'A' }), '/classrooms', 'POST', { name: '3º ano', identifier: 'A' }],
  [() => classroomsApi.update(1, { name: 'Novo' }), '/classrooms/1', 'PATCH', { name: 'Novo' }],
  [() => classroomsApi.enroll(1, 2), '/classrooms/1/students/2', 'PUT', undefined],
  [() => classroomsApi.unenroll(1, 2), '/classrooms/1/students/2', 'DELETE', undefined],
  [() => classroomsApi.assign(1, 2), '/classrooms/1/teachers/2', 'PUT', undefined],
  [() => classroomsApi.unassign(1, 2), '/classrooms/1/teachers/2', 'DELETE', undefined],
  [() => subjectsApi.create(1, 'Matemática'), '/classrooms/1/subjects', 'POST', { name: 'Matemática' }],
  [() => usersApi.create('students', { fullName: 'Ana', ra: '1', email: 'a@b.com' }), '/students', 'POST', { fullName: 'Ana', ra: '1', email: 'a@b.com' }],
  [() => usersApi.update('teachers', 2, { fullName: 'Ana' }), '/teachers/2', 'PATCH', { fullName: 'Ana' }],
  [() => schoolsApi.create({ nome: 'Escola', cnpj: '1', cidade: 'SP', logradouro: 'Rua', bairro: 'Sé' }), '/schools', 'POST', { nome: 'Escola', cnpj: '1', cidade: 'SP', logradouro: 'Rua', bairro: 'Sé' }],
  [() => registrationApi.invite('teachers', { email: 'a@b.com' }), '/invitations/teachers', 'POST', { email: 'a@b.com' }],
  [() => registrationApi.verify('a/b', '123456'), '/invitations/a%2Fb/verify', 'POST', { code: '123456' }],
  [() => registrationApi.resend('a/b'), '/invitations/a%2Fb/resend', 'POST', undefined],
  [() => registrationApi.complete('a/b', { name: 'Ana', ra: '1', password: 'x', termsAccepted: true, termsVersion: '1' }), '/invitations/a%2Fb/complete', 'POST', { name: 'Ana', ra: '1', password: 'x', termsAccepted: true, termsVersion: '1' }],
  [() => registrationApi.review(2, 'REJECTED', 'Motivo'), '/registration-requests/2', 'PATCH', { status: 'REJECTED', reason: 'Motivo' }],
] as const)('envia método, caminho e payload corretos: %s', async (call, path, method, body) => {
  await call(); expect(request).toHaveBeenCalledWith(path, body === undefined ? { method } : { method, body });
});
test.each([
  [authApi.me, '/me'], [authApi.terms, '/terms'], [authApi.accepted, '/terms/accepted'],
  [classroomsApi.list, '/classrooms'], [(signal?: AbortSignal) => classroomsApi.get(1, signal), '/classrooms/1'],
  [(signal?: AbortSignal) => classroomsApi.students(1, signal), '/classrooms/1/students'],
  [(signal?: AbortSignal) => classroomsApi.teachers(1, signal), '/classrooms/1/teachers'],
  [schoolsApi.list, '/schools'], [(signal?: AbortSignal) => subjectsApi.list(1, signal), '/classrooms/1/subjects'],
  [(signal?: AbortSignal) => usersApi.get('students', 1, signal), '/students/1'],
  [(signal?: AbortSignal) => registrationApi.invitation('a/b', signal), '/invitations/a%2Fb'],
] as const)('consultas propagam AbortSignal: %s', async (call, path) => {
  const signal = new AbortController().signal;
  await call(signal); expect(request).toHaveBeenCalledWith(path, { signal });
});
test('consultas paginadas preservam filtros', async () => {
  await usersApi.list('students'); expect(request).toHaveBeenLastCalledWith('/students', { signal: undefined });
  await usersApi.list('teachers', { page: 0, q: 'Ana' }); expect(request).toHaveBeenLastCalledWith('/teachers?page=0&q=Ana', { signal: undefined });
  await registrationApi.schools('São'); expect(request).toHaveBeenLastCalledWith('/schools/search?q=S%C3%A3o&size=100', { signal: undefined });
  await registrationApi.list('PENDING', 0); expect(request).toHaveBeenLastCalledWith('/registration-requests?status=PENDING&page=0&size=20', { signal: undefined });
  await registrationApi.photo(1); expect(request).toHaveBeenLastCalledWith('/registration-requests/1/photo', { responseType: 'blob', signal: undefined, headers: { Accept: 'image/png' } });
});
test('cadastro suporta JSON e foto multipart', async () => {
  const body = { name: 'Ana', ra: '1', email: 'a@b.com', birthDate: '2000-01-01', password: 'Password1', schoolId: 1, termsAccepted: true, termsVersion: '1' };
  await registrationApi.register(body); expect(request).toHaveBeenLastCalledWith('/auth/register', { method: 'POST', body });
  const photo = new File(['photo'], 'photo.png'); await registrationApi.register(body, photo);
  const data = request.mock.calls[1][1]!.body as FormData;
  expect(data.get('data')).toBe(JSON.stringify(body)); expect(data.get('photo')).toBe(photo);
});
test('me e termos tratam somente os status esperados', async () => {
  request.mockRejectedValueOnce(new ApiError(401, 'expired')); expect(await authApi.me()).toBeNull();
  request.mockRejectedValueOnce(new ApiError(404, 'absent')); expect(await authApi.terms()).toBeNull();
  for (const call of [authApi.me, authApi.terms]) {
    request.mockRejectedValueOnce(new ApiError(500, 'server')); await expect(call()).rejects.toThrow('server');
    request.mockRejectedValueOnce(new Error('network')); await expect(call()).rejects.toThrow('network');
  }
});

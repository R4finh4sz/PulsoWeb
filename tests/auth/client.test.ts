import { apiRequest, ApiError, queryString } from '@/api/client';
import { useAuthState } from '@/integrations/auth/state';
import { API_BASE_URL } from '@/api/config';
import { session } from '../helpers';

const fetchMock = jest.fn();
const response = (status = 200, data: unknown = { id: 1 }) => ({ ok: status < 400, status, json: jest.fn().mockResolvedValue(data), blob: jest.fn().mockResolvedValue(new Blob(['photo'])) });
beforeEach(() => { global.fetch = fetchMock; useAuthState.getState().setSession(session); });
test('GET utiliza Bearer, não usa cookies e desativa cache', async () => {
  fetchMock.mockResolvedValueOnce(response());
  expect(await apiRequest('/me')).toEqual({ id: 1 });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe(API_BASE_URL + '/me');
  expect(options).toMatchObject({ method: 'GET', credentials: 'omit', cache: 'no-store' });
  expect(options.headers.get('Authorization')).toBe('Bearer token');
  expect(options.headers.get('Accept')).toBe('application/json');
});
test('login não envia token anterior e serializa JSON', async () => {
  fetchMock.mockResolvedValueOnce(response());
  await apiRequest('/auth/login', { method: 'post', body: { email: 'a@b.com' } });
  const options = fetchMock.mock.calls[0][1];
  expect(options.headers.get('Authorization')).toBeNull();
  expect(options.headers.get('Content-Type')).toBe('application/json');
  expect(options.body).toBe('{"email":"a@b.com"}');
});
test('suporta ausência de sessão, 204, multipart e blob', async () => {
  useAuthState.getState().setSession(null);
  fetchMock.mockResolvedValueOnce(response(204));
  expect(await apiRequest('/logout')).toBeUndefined();
  expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBeNull();
  const body = new FormData(); body.set('photo', new File(['photo'], 'photo.png'));
  fetchMock.mockResolvedValueOnce(response());
  await apiRequest('/register', { method: 'POST', body });
  expect(fetchMock.mock.calls[1][1].body).toBe(body);
  expect(fetchMock.mock.calls[1][1].headers.get('Content-Type')).toBeNull();
  fetchMock.mockResolvedValueOnce(response());
  expect(await apiRequest('/photo', { responseType: 'blob', headers: { Accept: 'image/png' } })).toBeInstanceOf(Blob);
  expect(fetchMock.mock.calls[2][1].headers.get('Accept')).toBe('image/png');
});
test('401 expira a sessão atual e preserva erros do servidor', async () => {
  fetchMock.mockResolvedValueOnce(response(401, {}));
  await expect(apiRequest('/me')).rejects.toMatchObject({ name: 'ApiError', status: 401 });
  expect(useAuthState.getState().session).toBeNull();
  fetchMock.mockResolvedValueOnce(response(400, { detail: 'Inválido', errors: ['code'] }));
  await expect(apiRequest('/write', { method: 'POST' })).rejects.toMatchObject({ message: 'Inválido', errors: ['code'] });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
test('erros sem JSON e erros de rede são propagados', async () => {
  fetchMock.mockResolvedValueOnce({ ...response(500), json: async () => { throw new Error('not json'); } });
  await expect(apiRequest('/me')).rejects.toBeInstanceOf(ApiError);
  fetchMock.mockResolvedValueOnce(response(400, { errors: 'bad' }));
  await expect(apiRequest('/me')).rejects.toHaveProperty('errors', []);
  fetchMock.mockRejectedValueOnce(new Error('offline'));
  await expect(apiRequest('/me')).rejects.toThrow('offline');
});
test.each([200, 401])('resposta antiga (%s) não altera a nova sessão', async status => {
  let resolve!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const request = apiRequest('/me');
  useAuthState.getState().setSession({ ...session, accessToken: 'new' });
  resolve(response(status));
  await expect(request).rejects.toHaveProperty('name', status === 200 ? 'AbortError' : 'ApiError');
  expect(useAuthState.getState().session?.accessToken).toBe('new');
});
test('atualização da mesma credencial mantém resposta válida', async () => {
  fetchMock.mockImplementationOnce(async () => {
    useAuthState.getState().setSession({ ...session }); return response();
  });
  await expect(apiRequest('/me')).resolves.toEqual({ id: 1 });
});
test('query string preserva zero/false e escapa texto', () => {
  expect(queryString()).toBe('');
  expect(queryString({ q: 'Ana & B', page: 0, unassigned: false, empty: '', none: null, absent: undefined })).toBe('?q=Ana+%26+B&page=0&unassigned=false');
});

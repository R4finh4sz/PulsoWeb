import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { LoginResponse } from '@/integrations/auth/state';

export const router = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn() };
const clients: QueryClient[] = [];
afterEach(() => { for (const client of clients.splice(0)) client.clear(); });
export function queryWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  clients.push(client);
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper: Wrapper };
}
export const session: LoginResponse = {
  accessToken: 'token', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z',
  twoFactorRequired: false, codeExpiresAt: '2099-01-01T00:00:00Z', resendAvailableAt: '2000-01-01T00:00:00Z',
  user: { role: 'ADMIN', classroomId: null, schoolId: null, firstLogin: false, termsAccepted: true, termsAcceptedVersions: ['1'] },
};
export const admin = { id: 'admin-1', name: 'Admin Teste', email: 'admin@pulso.com', role: 'admin' as const };
export const coordinator = { id: 'coordinator-1', name: 'Coord Teste', email: 'coordenador@pulso.com', role: 'coordenador' as const };
export const teacher = { id: 'teacher-1', name: 'Prof Teste', email: 'professor@pulso.com', role: 'professor' as const };
export const schoolForm = { name: 'Escola Teste', cnpj: '11.222.333/0001-81', cep: '01001-000', street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' };
export const classroomForm = { year: '3', identifier: 'C', schoolId: 'school-1', teacherIds: ['teacher-1'], period: 'Manhã' as const };
export const teacherForm = { name: 'Maria Silva', email: 'maria@example.com', registration: 't-1' };
export const coordinatorForm = { name: 'Maria Silva', birthDate: '1990-01-01', registration: 'c-1' };
export const studentForm = { name: 'Maria Silva', email: 'maria@example.com', enrollment: 's-1', classroomId: 'class-1' };

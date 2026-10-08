import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/api/QueryProvider';
import { ApiError } from '@/api/client';

test('provider mantém cliente estável e limita novas tentativas de consulta', () => {
  const clients: ReturnType<typeof useQueryClient>[] = [];
  function Child() {
    clients.push(useQueryClient());
    return <p>Conteúdo</p>;
  }
  const { rerender } = render(<QueryProvider><Child /></QueryProvider>);
  rerender(<QueryProvider><Child /></QueryProvider>);
  expect(screen.getByText('Conteúdo')).toBeVisible();
  expect(clients[0]).toBe(clients[1]);
  const options = clients[0].getDefaultOptions();
  const retry = options.queries!.retry as (count: number, error: Error) => boolean;
  expect(retry(0, new ApiError(400, 'Invalid'))).toBe(false);
  expect(retry(0, new ApiError(500, 'Server'))).toBe(true);
  expect(retry(0, new Error('Offline'))).toBe(true);
  expect(retry(1, new Error('Offline'))).toBe(false);
  expect(options.mutations!.retry).toBe(false);
});

import { fireEvent, render, screen } from '@testing-library/react';
import { BackLink } from '@/components/ui/BackLink';

const back = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ back }) }));

test('retorno sem destino usa histórico de navegação', () => {
  render(<BackLink />);
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(back).toHaveBeenCalledTimes(1);
});

test('retorno pode ser bloqueado para confirmar alterações', () => {
  const listener = (event: Event) => event.preventDefault();
  window.addEventListener('pulso:before-back', listener);
  render(<BackLink />);
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(back).not.toHaveBeenCalled();
  window.removeEventListener('pulso:before-back', listener);
});

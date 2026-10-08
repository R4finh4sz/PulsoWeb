import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { FeedbackModalHost } from '@/components/ui/FeedbackModalHost';
import { useFeedbackStore } from '@/store/feedbackStore';
import { act } from '@testing-library/react';

test('botão usa tipo button e repassa eventos e atributos', () => {
  const click = jest.fn(); const { rerender } = render(<Button onClick={click}>Salvar</Button>);
  fireEvent.click(screen.getByRole('button')); expect(click).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  rerender(<Button type="submit" disabled className="custom">Salvar</Button>);
  expect(screen.getByRole('button')).toBeDisabled(); expect(screen.getByRole('button')).toHaveClass('custom');
});
test('input alterna senha e conecta mensagem de erro', () => {
  const { rerender } = render(<Input id="pw" label="Senha" type="password" error="Obrigatória" aria-describedby="help" />);
  expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-describedby', 'help pw-error');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' })); expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' })); expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  rerender(<Input id="pw" label="Senha" type="password" disabled />); expect(screen.queryByRole('button')).toBeNull();
  rerender(<Input id="pw" label="Nome" />); expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-describedby');
});
test('select exibe erro acessível e opções', () => {
  const { rerender } = render(<Select id="s" label="Escola" error="Selecione"><option value="1">Teste</option></Select>);
  expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true'); expect(screen.getByRole('alert')).toHaveTextContent('Selecione');
  rerender(<Select id="s" label="Escola"><option>Teste</option></Select>); expect(screen.queryByRole('alert')).toBeNull();
});
test('multiselect adiciona/remove, fecha com Escape, clique fora e blur', () => {
  function Form() { const [value, setValue] = useState<string[]>([]); return <MultiSelect id="m" name="m" label="Professores" value={value} onChange={setValue} options={[{ value: '1', label: 'Ana', description: 'Email' }, { value: '2', label: 'Bia' }]} error="Selecione" />; }
  render(<Form />); const trigger = screen.getByRole('button');
  fireEvent.click(trigger); fireEvent.click(screen.getByLabelText(/Ana/)); expect(trigger).toHaveTextContent('Ana');
  fireEvent.click(screen.getByLabelText(/Ana/)); expect(trigger).toHaveTextContent('Selecione');
  fireEvent.keyDown(trigger, { key: 'Escape' }); expect(trigger).toHaveAttribute('aria-expanded', 'false'); expect(trigger).toHaveFocus();
  fireEvent.click(trigger); fireEvent.pointerDown(trigger); expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.pointerDown(document.body); expect(trigger).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(trigger); fireEvent.blur(trigger, { relatedTarget: document.body }); expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
test('multiselect vazio comunica ausência de opções', () => {
  render(<MultiSelect id="m" name="m" label="Professores" value={[]} onChange={jest.fn()} options={[]} />);
  fireEvent.click(screen.getByRole('button')); expect(screen.getByText('Nenhuma opção disponível.')).toBeVisible();
});
test.each(['success', 'error'] as const)('modal de %s permite fechar', type => {
  const close = jest.fn(); const { rerender } = render(<FeedbackModal type={type} title="Resultado" message="Mensagem" onClose={close} />);
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Resultado'); fireEvent.click(screen.getByRole('button')); expect(close).toHaveBeenCalled();
  rerender(<FeedbackModal type={type} title="Resultado" message="Mensagem" onClose={close} actionLabel="OK" />); expect(screen.getByRole('button', { name: 'OK' })).toBeVisible();
});
test('host acompanha store de feedback', () => {
  useFeedbackStore.getState().closeFeedback(); render(<FeedbackModalHost />); expect(screen.queryByRole('dialog')).toBeNull();
  act(() => useFeedbackStore.getState().showFeedback({ type: 'success', message: 'Salvo' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Salvo'); fireEvent.click(screen.getByRole('button')); expect(screen.queryByRole('dialog')).toBeNull();
});

import { QuizForm } from '@/components/screens/SubjectQuizzes/QuizForm';
import { BackLink } from '@/components/ui/BackLink';
import { CreateQuizSchema } from '@/validation/Quiz.validation';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { router } from '../helpers';

jest.mock('next/navigation', () => ({ useRouter: () => router }));

test('cancelamento vazio sai direto; conteúdo preenchido exige confirmação e preserva edição', () => {
  const onCancel = jest.fn();
  render(<QuizForm themes={['Frações']} pending={false} onSubmit={jest.fn()} onCancel={onCancel} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Pergunta'), { target: { value: 'Pergunta em edição' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Sair e descartar' })).toHaveClass('bg-[#e83e32]', 'text-white');
  expect(screen.getByRole('button', { name: 'Continuar editando' })).not.toHaveClass('bg-[#e83e32]');
  expect(onCancel).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }));
  expect(screen.getByLabelText('Pergunta')).toHaveValue('Pergunta em edição');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sair e descartar' }));
  expect(onCancel).toHaveBeenCalledTimes(2);
});

test('link Voltar pede confirmação antes de navegar', () => {
  render(<><BackLink /><QuizForm themes={['Frações']} pending={false} onSubmit={jest.fn()} onCancel={jest.fn()} /></>);
  fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'Frações' } });
  fireEvent.click(screen.getByText('Voltar'));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(router.back).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Sair e descartar' }));
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('exige todas as 10 questões e conserva os dados ao navegar', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<QuizForm themes={['Frações']} pending={false} onSubmit={onSubmit} onCancel={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Questão 10, pendente' }));
  expect(screen.getByRole('button', { name: 'Questão 10, pendente' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'Questão 1 de 10' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull();
  for (let index = 0; index < 10; index++) {
    fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'Frações' } });
    fireEvent.change(screen.getByLabelText('Pergunta'), { target: { value: `Pergunta ${index + 1}` } });
    for (const letter of 'ABCD') fireEvent.change(screen.getByLabelText(`Alternativa ${letter}`), { target: { value: `Resposta ${letter}` } });
    fireEvent.click(screen.getByRole('radio', { name: 'Alternativa B correta' }));
    if (index < 9) fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
  }
  expect(screen.getByRole('status')).toHaveTextContent('10 de 10 questões concluídas');
  expect(screen.getByRole('button', { name: 'Anterior' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
  expect(screen.getByLabelText('Pergunta')).toHaveValue('Pergunta 9');
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
  fireEvent.click(screen.getByRole('button', { name: 'Criar e abrir quiz' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0].questions).toHaveLength(10);
  expect(onSubmit.mock.calls[0][0].questions[0].correctOption).toBe(1);
});

test('validação rejeita contagem incorreta, campos vazios e alternativas repetidas', () => {
  const question = { question: 'Qual o resultado?', options: ['1', '2', '3', '4'], theme: 'Frações', correctOption: 1 };
  const questions = Array.from({ length: 10 }, () => ({ ...question }));
  expect(CreateQuizSchema.safeParse({ questions }).success).toBe(true);
  for (const length of [0, 9, 11]) expect(CreateQuizSchema.safeParse({ questions: Array.from({ length }, () => question) }).success).toBe(false);
  for (const invalid of [{ question: '   ' }, { theme: '' }, { options: ['1', '1', '3', '4'] }, { options: ['1', '2', '3'] }, { correctOption: -1 }, { correctOption: 4 }]) {
    expect(CreateQuizSchema.safeParse({ questions: [{ ...question, ...invalid }, ...questions.slice(1)] }).success).toBe(false);
  }
});

test('bloqueia avanço até completar a questão e mostra erros nos campos sem quadrados vermelhos', () => {
  render(<QuizForm themes={['Frações']} pending={false} onSubmit={jest.fn()} onCancel={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Questão 1, pendente' })).toHaveClass('bg-white');
  fireEvent.change(screen.getByLabelText('Pergunta'), { target: { value: 'Quanto é 1 + 1?' } });
  expect(screen.getByRole('button', { name: 'Questão 1, pendente' })).toHaveClass('bg-white');
  fireEvent.blur(screen.getByLabelText('Tema'));
  expect(screen.getByLabelText('Tema')).toHaveAccessibleDescription('Selecione um tema.');
  expect(screen.getByRole('button', { name: 'Questão 2, pendente' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'Frações' } });
  for (const letter of 'ABCD') fireEvent.change(screen.getByLabelText(`Alternativa ${letter}`), { target: { value: `Resposta ${letter}` } });
  fireEvent.click(screen.getByRole('radio', { name: 'Alternativa B correta' }));
  const complete = screen.getByRole('button', { name: 'Questão 1, concluída' });
  expect(complete).toHaveClass('border-emerald-700', 'bg-emerald-50');
  expect(complete.querySelector('svg')).toBeNull();
  expect(screen.getByRole('button', { name: 'Questão 2, pendente' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Questão 3, pendente' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
  expect(complete).toHaveClass('border-emerald-700', 'bg-emerald-50');
  fireEvent.click(complete);
  fireEvent.change(screen.getByLabelText('Alternativa A'), { target: { value: 'Resposta B' } });
  fireEvent.blur(screen.getByLabelText('Alternativa A'));
  expect(screen.getByRole('button', { name: 'Questão 1, pendente' })).toHaveClass('bg-white');
  expect(screen.getByRole('button', { name: 'Questão 2, pendente' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('As quatro alternativas devem ser diferentes.');
});

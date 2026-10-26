import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QuizForm } from '@/components/screens/SubjectQuizzes/QuizForm';
import { CreateQuizSchema } from '@/validation/Quiz.validation';
import { router } from '../helpers';
import { BackLink } from '@/components/ui/BackLink';

jest.mock('next/navigation', () => ({ useRouter: () => router }));

test('cancelamento vazio sai direto; conteúdo preenchido exige confirmação e preserva edição', () => {
  const onCancel = jest.fn();
  render(<QuizForm themes={['Frações']} pending={false} onSubmit={jest.fn()} onCancel={onCancel} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Pergunta'), { target: { value: 'Pergunta em edição' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('dialog')).toBeVisible();
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
  fireEvent.click(screen.getByRole('button', { name: 'Criar e abrir quiz' }));
  expect(screen.getByRole('alert')).toHaveTextContent('todas as 10 questões');
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'Questão 1 de 10' })).toBeVisible();
  for (let index = 0; index < 10; index++) {
    fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'Frações' } });
    fireEvent.change(screen.getByLabelText('Pergunta'), { target: { value: `Pergunta ${index + 1}` } });
    for (const letter of 'ABCD') fireEvent.change(screen.getByLabelText(`Alternativa ${letter}`), { target: { value: `Resposta ${letter}` } });
    fireEvent.click(screen.getByRole('radio', { name: 'Alternativa B correta' }));
    if (index < 9) fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
  }
  expect(screen.getByRole('status')).toHaveTextContent('10 de 10 questões concluídas');
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

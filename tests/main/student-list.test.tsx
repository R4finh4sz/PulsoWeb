import { StudentList } from '@/components/screens/ClassroomDetails/StudentList';
import type { User } from '@/integrations/types';
import { fireEvent, render, screen, within } from '@testing-library/react';

const students: User[] = Array.from({ length: 40 }, (_, index) => ({
  id: index + 1, fullName: `Aluno ${String(index + 1).padStart(2, '0')}`, email: `aluno${index + 1}@exemplo.com`,
  ra: String(index + 1).padStart(5, '0'), role: 'STUDENT', classroomId: 1,
}));

test('pagina 40 alunos, busca em toda a turma e altera tamanho da página', () => {
  render(<StudentList students={students} />);
  const rows = () => within(screen.getByRole('list', { name: 'Alunos da turma' })).getAllByRole('listitem');
  expect(rows()).toHaveLength(10);
  expect(screen.getByRole('button', { name: 'Página anterior de alunos' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Próxima página de alunos' }));
  expect(screen.getByText('Aluno 11')).toBeVisible();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '00039' } });
  expect(rows()).toHaveLength(1);
  expect(screen.getByText('Aluno 39')).toBeVisible();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '40' } });
  expect(rows()).toHaveLength(40);
  expect(screen.getByRole('button', { name: 'Próxima página de alunos' })).toBeDisabled();
});

test('busca ignora acentos e exibe recuperação para nenhum resultado', () => {
  render(<StudentList students={[{ ...students[0], fullName: 'João Souza' }]} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'joao' } });
  expect(screen.getByText('João Souza')).toBeVisible();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'inexistente' } });
  expect(screen.getByText('Nenhum aluno encontrado. Tente outro nome ou RA.')).toBeVisible();
});

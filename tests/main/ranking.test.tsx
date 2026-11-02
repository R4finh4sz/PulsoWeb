import { fireEvent, render, screen, within } from '@testing-library/react';
import { RankingContent } from '@/components/screens/Ranking';
import { rankingApi, type RankingEntry } from '@/integrations/ranking/api';
import { rankEntries } from '@/utils/ranking';
import { queryWrapper } from '../helpers';

jest.mock('@/integrations/ranking/api', () => ({ rankingApi: { get: jest.fn() } }));
const entries: RankingEntry[] = [
  { studentId: 1, name: 'Ana', schoolId: 1, schoolName: 'Escola Um', grade: '1º ano', correctAnswers: 20, completedActivities: 2 },
  { studentId: 2, name: 'Bruno', schoolId: 2, schoolName: 'Escola Dois', grade: '2º ano', correctAnswers: 15, completedActivities: 3 },
  { studentId: 3, name: 'Carla', schoolId: 1, schoolName: 'Escola Um', grade: '1º ano', correctAnswers: 20, completedActivities: 4 },
];

test('classifica por categoria, compartilha posições em empates e combina filtros', () => {
  expect(rankEntries(entries, 'correctAnswers').map((entry) => entry.position)).toEqual([1, 1, 3]);
  expect(rankEntries(entries, 'completedActivities').map((entry) => entry.name)).toEqual(['Carla', 'Bruno', 'Ana']);
  expect(rankEntries(entries, 'correctAnswers', '2', '1º ano')).toEqual([]);
  expect(rankEntries(entries, 'correctAnswers', '1', '1º ano')).toHaveLength(2);
});

test('mostra ranking geral e permite trocar categoria e filtrar por escola e série', async () => {
  jest.mocked(rankingApi.get).mockImplementation(async (_signal, filters = {}) => ({
    period: { label: 'Bimestre atual', startsAt: '2026-09-01', endsAt: '2026-11-01' },
    schools: [{ id: 1, name: 'Escola Um' }, { id: 2, name: 'Escola Dois' }],
    grades: ['1º ano', '2º ano'], canFilterGlobalGrades: true,
    entries: entries.filter((entry) => (!filters.schoolId || entry.schoolId === Number(filters.schoolId)) && (!filters.grade || entry.grade === filters.grade)),
  }));
  render(<RankingContent />, { wrapper: queryWrapper().wrapper });
  await screen.findByRole('table');
  expect(screen.getByText(/Os valores do ranking serão zerados a cada bimestre/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Maior quantidade de atividades feitas/ }));
  expect(within(screen.getAllByRole('row')[1]).getByText('Carla')).toBeVisible();
  fireEvent.change(screen.getByRole('combobox', { name: 'Escola' }), { target: { value: '2' } });
  expect(await screen.findByText('Bruno')).toBeVisible();
  expect(screen.queryByText('Ana')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Série' }), { target: { value: '1º ano' } });
  expect(await screen.findByText(/Nenhuma atividade concluída/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(await screen.findByText('Ana')).toBeVisible();
});

test('global não expõe série nem filtro de escolas sem acesso', async () => {
  jest.mocked(rankingApi.get).mockResolvedValue({
    period: { label: 'Bimestre atual', startsAt: '2026-09-01', endsAt: '2026-11-01' },
    schools: [{ id: 1, name: 'Escola Um' }], grades: [], canFilterGlobalGrades: false,
    entries: entries.map((entry) => ({ ...entry, grade: null })),
  });
  render(<RankingContent />, { wrapper: queryWrapper().wrapper });
  await screen.findByRole('table');
  expect(screen.queryByRole('combobox', { name: 'Série' })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Série' })).not.toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Escola Dois' })).not.toBeInTheDocument();
  expect(screen.getByText('Bruno')).toBeVisible();
});

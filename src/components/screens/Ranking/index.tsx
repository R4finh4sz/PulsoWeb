"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCheck, ClipboardCheck, Trophy } from "lucide-react";
import { EmptyState, ErrorMessage, actionClass, fieldClass } from "@/components/screens/Integration/shared";
import { rankingApi } from "@/integrations/ranking/api";
import { rankEntries, type RankingCategory } from "@/utils/ranking";

function classroomIdentifier(name?: string | null) {
  return name?.trim().match(/[A-Za-z]+$/)?.[0] ?? "—";
}

export function RankingContent() {
  const [category, setCategory] = useState<RankingCategory>("correctAnswers");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [classroom, setClassroom] = useState("");
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: ["ranking", school, grade, classroom], queryFn: ({ signal }) => rankingApi.get(signal, { schoolId: school, grade, classroomIdentifier: classroom }), refetchInterval: 60000 });
  const canSeeGrades = Boolean(school || query.data?.canFilterGlobalGrades);
  const rows = rankEntries(query.data?.entries ?? [], category);
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const current = Math.min(page, pages - 1);
  const label = category === "correctAnswers" ? "Acertos" : "Atividades feitas";

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950">
        <CalendarDays className="mt-0.5 shrink-0" size={22} aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Uma nova chance a cada bimestre</h2>
          <p className="mt-1 text-sm leading-6">Os valores do ranking serão zerados a cada bimestre. Somente os acertos e as atividades concluídas no bimestre vigente contam para a classificação.</p>
          {query.data && <p className="mt-2 text-xs font-medium">Período: {query.data.period.label}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Categoria do ranking">
        {([
          { value: "correctAnswers", title: "Maiores acertos", description: "Total de respostas corretas no bimestre", Icon: CheckCheck },
          { value: "completedActivities", title: "Maior quantidade de atividades feitas", description: "Total de atividades concluídas no bimestre", Icon: ClipboardCheck },
        ] as const).map(({ value, title, description, Icon }) => (
          <button key={value} type="button" aria-pressed={category === value} onClick={() => { setCategory(value); setPage(0); }} className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-cyan-700 ${category === value ? "border-cyan-700 bg-white ring-1 ring-cyan-700" : "border-(--line) bg-white hover:bg-slate-50"}`}>
            <Icon size={25} className="shrink-0 text-cyan-800" aria-hidden="true" />
            <span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-(--muted)">{description}</span></span>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-(--line) bg-white" aria-label="Classificação do ranking">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3"><Trophy className="text-amber-600" aria-hidden="true" /><h2 className="text-lg font-semibold">{school || grade ? "Ranking filtrado" : "Ranking geral"}</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium">Escola
              <select className={fieldClass} value={school} onChange={(event) => { setSchool(event.target.value); setGrade(""); setClassroom(""); setPage(0); }} disabled={!query.data}>
                <option value="">Ranking global</option>
                {query.data?.schools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            {canSeeGrades && <label className="text-sm font-medium">Série
              <select className={fieldClass} value={grade} onChange={(event) => { setGrade(event.target.value); setClassroom(""); setPage(0); }} disabled={!query.data}>
                <option value="">Todas as séries</option>
                {query.data?.grades.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>}
            {school && <label className="text-sm font-medium">Turma
              <select className={fieldClass} value={classroom} onChange={(event) => { setClassroom(event.target.value); setPage(0); }} disabled={!query.data}>
                <option value="">Todas as turmas</option>
                {Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index)).map((letter) => <option key={letter} value={letter}>{letter}</option>)}
              </select>
            </label>}
          </div>
          {!query.data?.canFilterGlobalGrades && <p className="text-xs text-(--muted)">No ranking global, você vê a classificação de todas as escolas. Para consultar séries, selecione uma escola à qual você tem acesso.</p>}
          {(school || grade) && <button type="button" className="min-h-11 text-sm font-medium text-cyan-800 underline" onClick={() => { setSchool(""); setGrade(""); setClassroom(""); setPage(0); }}>Limpar filtros</button>}
          <p className="text-xs text-(--muted)">Classificação por {label.toLocaleLowerCase("pt-BR")}. Valores iguais compartilham a mesma posição.</p>
          {query.isPending && <p role="status">Carregando ranking…</p>}
          <ErrorMessage error={query.error} />
          {query.isError && <button type="button" className={actionClass} onClick={() => void query.refetch()}>Tentar novamente</button>}
        </div>
        {query.data && !query.isError && (rows.length === 0 ? <div className="p-6"><EmptyState title="Nenhuma atividade concluída neste bimestre para os filtros selecionados." /></div> : <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Ranking por {label.toLocaleLowerCase("pt-BR")}</caption>
              <thead className="border-y border-(--line) bg-slate-50 text-xs text-(--muted)"><tr>{["Posição", "Aluno", "Escola", ...(canSeeGrades ? ["Série"] : []), ...(school ? ["Turma"] : []), label].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-4">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{rows.slice(current * 10, current * 10 + 10).map((entry) => <tr key={entry.studentId} className="hover:bg-slate-50">
                <td className="px-5 py-4"><span className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-semibold ${entry.position <= 3 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{entry.position}º</span></td>
                <th scope="row" className="min-w-40 px-5 py-4 font-medium">{entry.name}</th><td className="min-w-48 px-5 py-4 text-(--muted)">{entry.schoolName}</td>{canSeeGrades && <td className="whitespace-nowrap px-5 py-4">{entry.grade}</td>}{school && <td className="whitespace-nowrap px-5 py-4">{classroomIdentifier(entry.classroomName)}</td>}<td className="px-5 py-4 font-semibold tabular-nums text-cyan-800">{entry[category].toLocaleString("pt-BR")}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <nav aria-label="Paginação do ranking" className="flex items-center justify-end gap-3 border-t border-(--line) p-5">
            <button type="button" aria-label="Página anterior do ranking" disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded-lg border border-(--line) p-3 disabled:opacity-40"><ArrowLeft size={18} /></button>
            <span className="text-xs text-(--muted)" aria-live="polite">Página {current + 1} de {pages}</span>
            <button type="button" aria-label="Próxima página do ranking" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)} className="rounded-lg border border-(--line) p-3 disabled:opacity-40"><ArrowRight size={18} /></button>
          </nav>
        </>)}
      </section>
    </div>
  );
}

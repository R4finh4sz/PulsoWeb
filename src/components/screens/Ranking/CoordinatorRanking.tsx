"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import {
  ErrorMessage,
  EmptyState,
  actionClass,
  fieldClass,
} from "@/components/screens/Integration/shared";
import { useMe } from "@/integrations/auth/hooks";
import { studentRankingApi } from "@/integrations/ranking/students";
import { useSchools } from "@/integrations/schools/hooks";
import { BackLink } from "@/components/ui/BackLink";

export function CoordinatorRanking({ admin = false }: { admin?: boolean }) {
  const me = useMe();
  const schools = useSchools(admin);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [scope, setScope] = useState("general");
  const [year, setYear] = useState(new Date().getFullYear());
  const [bimester, setBimester] = useState(() => {
    const month = new Date().getMonth() + 1;
    return month >= 10 ? 4 : month >= 7 ? 3 : month >= 4 ? 2 : 1;
  });
  const schoolId = admin
    ? selectedSchool
      ? Number(selectedSchool)
      : undefined
    : me.data?.schoolId;
  const missingSchool = scope === "school" && !schoolId;
  const validYear = Number.isInteger(year) && year >= 1 && year <= 9999;
  const query = useQuery({
    queryKey: ["student-ranking", year, bimester, scope, schoolId, admin],
    enabled: !missingSchool && validYear,
    queryFn: ({ signal }) =>
      studentRankingApi.list(
        {
          year,
          bimester,
          ...((admin || scope === "school") && schoolId ? { schoolId } : {}),
        },
        signal,
      ),
    refetchInterval: 60_000,
  });
  return (
    <section className="space-y-6" aria-label="Ranking dos alunos">
      {admin && <BackLink />}
      <div className="grid gap-4 sm:grid-cols-3">
        {admin ? (
          <label className="text-sm font-medium">
            Escola
            <select
              className={fieldClass}
              value={selectedSchool}
              onChange={(event) => setSelectedSchool(event.target.value)}
            >
              <option value="">Todas as escolas</option>
              {schools.data?.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.nome}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="text-sm font-medium">
            Ranking
            <select
              className={fieldClass}
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <option value="general">Geral</option>
              <option value="school">Minha escola</option>
            </select>
          </label>
        )}
        <label className="text-sm font-medium">
          Bimestre
          <select
            className={fieldClass}
            value={bimester}
            onChange={(event) => setBimester(Number(event.target.value))}
          >
            {[1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>
                {value}º bimestre
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Ano
          <input
            type="number"
            min={1}
            max={9999}
            required
            className={fieldClass}
            value={year || ""}
            onChange={(event) => setYear(Number(event.target.value))}
          />
        </label>
      </div>
      <p className="text-sm text-(--muted)">
        Acompanhe os acertos e as atividades concluídas no bimestre selecionado.
      </p>
      {admin && schools.isPending && <p role="status">Carregando escolas…</p>}
      {admin && <ErrorMessage error={schools.error} />}
      {admin && schools.isError && (
        <button className={actionClass} onClick={() => void schools.refetch()}>
          Tentar carregar escolas novamente
        </button>
      )}
      {missingSchool && (
        <p role="status">
          Selecione uma escola ativa para consultar o ranking da escola.
        </p>
      )}
      {!validYear && <p role="alert">Informe um ano entre 1 e 9999.</p>}
      {scope === "school" && <ErrorMessage error={me.error} />}
      {!missingSchool && validYear && (
        <>
          {query.isPending && <p role="status">Carregando ranking…</p>}
          <ErrorMessage error={query.error} />
          {query.isError && (
            <button
              className={actionClass}
              onClick={() => void query.refetch()}
            >
              Tentar novamente
            </button>
          )}
          {query.data &&
            !query.isError &&
            (query.data.length === 0 ? (
              <EmptyState title="Nenhuma atividade concluída neste bimestre." />
            ) : (
              <ol
                className="overflow-hidden rounded-2xl border border-(--line) bg-white"
                aria-label="Classificação"
              >
                {query.data.map((student, index) => (
                  <li
                    key={student.studentId}
                    className={`flex items-center gap-4 px-5 py-5 ${index === 0 ? "bg-amber-50" : "border-t border-(--line)"}`}
                  >
                    <span className="flex w-10 shrink-0 flex-col items-center gap-1 text-sm font-semibold text-slate-600">
                      {student.position <= 3 && (
                        <Trophy
                          size={20}
                          aria-hidden="true"
                          className={
                            student.position === 1
                              ? "text-amber-700"
                              : student.position === 2
                                ? "text-slate-600"
                                : "text-orange-800"
                          }
                        />
                      )}
                      {student.position}º
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold">
                        {student.studentName}
                      </span>
                      <span className="mt-1 block text-xs text-(--muted)">
                        {student.totalActivities.toLocaleString("pt-BR")}{" "}
                        atividades concluídas
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-lg font-semibold tabular-nums text-cyan-800"
                      aria-label={`${student.accuracyPercentage}% de acertos`}
                    >
                      {student.accuracyPercentage.toLocaleString("pt-BR")}%
                    </span>
                  </li>
                ))}
              </ol>
            ))}
        </>
      )}
    </section>
  );
}

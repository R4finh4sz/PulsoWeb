import type { buildClassroomReports } from "@/utils/teacherReports";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type ClassroomReport = ReturnType<typeof buildClassroomReports>[number];

const columns =
  "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]";
const format = (value: number) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function SchoolReport({
  name,
  rooms,
  statusQuery,
}: {
  name: string;
  rooms: ClassroomReport[];
  statusQuery: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-(--line) bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--line) px-5 py-5 sm:px-6">
        <h3 className="min-w-0 break-words text-base font-semibold">{name}</h3>
        <span className="text-sm text-(--muted)">
          {rooms.length} {rooms.length === 1 ? "turma" : "turmas"}
        </span>
      </div>

      <div
        aria-hidden="true"
        className={`hidden items-center gap-6 border-b border-(--line) bg-slate-50 px-6 py-3 text-xs font-medium text-(--muted) lg:grid ${columns}`}
      >
        <span>Turma</span>
        <span>Média das notas</span>
        <span>Entregas de atividades</span>
        <span>Pendências dos alunos</span>
        <span className="w-28 text-right">Relatório</span>
      </div>

      <ul className="divide-y divide-(--line)">
        {rooms.map((report) => (
          <li
            key={report.id}
            className={`grid items-start gap-5 px-5 py-6 sm:px-6 lg:gap-6 ${columns}`}
          >
            <div className="min-w-0">
              <Link
                href={`/teacher/reports/classrooms/${report.id}${statusQuery}`}
                className="break-words text-base font-semibold text-(--blue-dark) hover:underline"
              >
                {report.name}
              </Link>
              <p className="mt-1 text-xs leading-5 text-(--muted)">
                {report.students.length}{" "}
                {report.students.length === 1 ? "aluno" : "alunos"}
                {" · "}
                {report.activities}{" "}
                {report.activities === 1 ? "atividade" : "atividades"}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-subgrid lg:gap-6">
              <div>
                <dt className="mb-1 text-xs text-(--muted) lg:sr-only">
                  Média das notas
                </dt>
                <dd className="text-base font-semibold tabular-nums">
                  {report.average === null ? (
                    <span className="text-sm font-normal text-(--muted)">
                      Sem notas
                    </span>
                  ) : (
                    <>
                      {format(report.average)}
                      <span className="text-sm font-normal text-(--muted)">
                        {" "}
                        / 10
                      </span>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-(--muted) lg:sr-only">
                  Entregas de atividades
                </dt>
                <dd>
                  <span className="block text-base font-semibold tabular-nums">
                    {report.completion === null
                      ? "—"
                      : `${format(report.completion)}%`}
                  </span>
                  <span className="mt-1 block text-xs leading-5 tabular-nums text-(--muted)">
                    {report.submitted} de {report.assigned} previstas
                  </span>
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="mb-1 text-xs text-(--muted) lg:sr-only">
                  Pendências dos alunos
                </dt>
                <dd>
                  <span
                    className={`block text-base font-medium ${report.attention ? "text-amber-800" : "text-emerald-800"}`}
                  >
                    {report.attention
                      ? `${report.attention} ${report.attention === 1 ? "aluno" : "alunos"}`
                      : "Sem pendências"}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-(--muted)">
                    {report.attention
                      ? "Com entregas vencidas"
                      : "Nenhuma entrega vencida"}
                  </span>
                </dd>
              </div>
            </dl>

            <Link
              aria-label={`Ver relatório da turma ${report.name} · ${name}`}
              href={`/teacher/reports/classrooms/${report.id}${statusQuery}`}
              className="inline-flex min-h-11 w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-(--line) px-3 text-sm font-medium text-(--blue-dark) hover:bg-cyan-50 active:bg-cyan-100 lg:w-28 lg:justify-self-end"
            >
              Ver turma <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

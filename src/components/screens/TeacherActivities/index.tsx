"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  ErrorMessage,
  Protected,
  actionClass,
} from "@/components/screens/Integration/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthState } from "@/integrations/auth/state";
import { quizzesApi } from "@/integrations/quizzes/api";
import { getDemoUser, mockAccessEnabled } from "@/mocks/access";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardList, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function Activities() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const token = useAuthState((state) => state.session?.accessToken);
  const demo = mockAccessEnabled && !!getDemoUser(token);
  const query = useQuery({
    queryKey: ["teacher-activities", token],
    queryFn: ({ signal }) => quizzesApi.activities(signal),
    enabled: demo,
    refetchInterval: 30000,
  });
  const activities = query.data
    ?.filter(
      (activity) =>
        (status === "ALL" || activity.status === status) &&
        `Quiz ${activity.id} ${activity.subjectName} ${activity.classroomName} ${activity.schoolName}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.trim().toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Atividades</h1>
        <p className="page-description mt-3">
          Acompanhe os quizzes que você criou e os prazos de encerramento.
        </p>
      </div>
      {!demo ? (
        <EmptyState
          icon={ClipboardList}
          title="Atividades indisponíveis neste ambiente."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-(--line) bg-white px-4 py-3">
              <Search
                size={17}
                aria-hidden="true"
                className="shrink-0 text-(--muted)"
              />
              <input
                type="search"
                aria-label="Buscar atividades"
                placeholder="Buscar por matéria, turma ou escola"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <select
              aria-label="Status das atividades"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="min-h-12 rounded-xl border border-(--line) bg-white px-4 text-sm"
            >
              <option value="ALL">Todos os status</option>
              <option value="OPEN">Em aberto</option>
              <option value="CLOSED">Finalizado</option>
            </select>
          </div>
          {query.isPending && <p role="status">Carregando atividades…</p>}
          <ErrorMessage error={query.error} />
          {query.isError && (
            <button className={actionClass} onClick={() => query.refetch()}>
              Tentar novamente
            </button>
          )}
          {query.isSuccess && !activities?.length && (
            <EmptyState
              icon={ClipboardList}
              title={
                search || status !== "ALL"
                  ? "Nenhuma atividade encontrada."
                  : "Nenhuma atividade criada."
              }
            />
          )}
          <ul className="grid gap-5 md:grid-cols-2">
            {activities?.map((activity) => (
              <li key={activity.id}>
                <Link
                  href={`/teacher/activities/${activity.id}`}
                  className="choice-card h-full"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f7fa] text-(--blue-dark)"
                    >
                      <ClipboardList size={24} />
                    </span>
                    <span
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${activity.status === "OPEN" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
                    >
                      {activity.status === "OPEN" ? "Em aberto" : "Finalizado"}
                    </span>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold">
                    Quiz {activity.id} · {activity.subjectName}
                  </h2>
                  <p className="mt-2 text-sm text-(--muted)">
                    {activity.classroomName} · {activity.schoolName}
                  </p>
                  <p className="mt-2 text-sm text-(--muted)">
                    {activity.questions.length} questões
                  </p>
                  <p className="mt-5 flex items-start gap-2 text-sm font-medium text-(--blue-dark)">
                    <CalendarClock
                      size={18}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                    />
                    {activity.status === "OPEN"
                      ? "Encerra em "
                      : "Encerrado em "}
                    {dateFormat.format(new Date(activity.closesAt))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function TeacherActivities() {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          <Activities />
        </TeacherShell>
      )}
    </Protected>
  );
}

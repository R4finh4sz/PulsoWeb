"use client";

import { useId, useRef } from "react";
import { DashboardIcon } from "@/components/ui/DashboardIcon";
import { mockUsers, type classrooms } from "@/mocks/platform";

type Classroom = (typeof classrooms)[number];

export function ClassroomCard({ room }: { room: Classroom }) {
  const teachers = mockUsers.filter((user) => room.teacherIds.includes(user.id));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={`Abrir turma ${room.name}`}
        className="group w-full rounded-xl border border-[var(--line)] bg-white p-4 text-left transition hover:border-[var(--blue)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue)]"
      >
        <span className="flex items-center gap-3">
          <span className={`rounded-xl p-3 ${room.color === "yellow" ? "bg-[#fff6d5] text-[#866b00]" : "bg-[#e8f5f8] text-[var(--blue)]"}`}><DashboardIcon name="book" /></span>
          <span className="flex-1">
            <span className="block font-semibold">{room.name}</span>
            <span className="mt-1 block text-xs text-[var(--muted)]">Ensino fundamental · {room.period}</span>
          </span>
          <DashboardIcon name="arrow" className="h-4 w-4 text-[var(--blue)] transition-transform group-hover:translate-x-1" />
        </span>
        <span className="mt-4 flex justify-between gap-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
          <span>{room.students} alunos vinculados</span>
          <span>{teachers.length} {teachers.length === 1 ? "professor" : "professores"}</span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
            event.currentTarget.close();
          }
        }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-6 text-[var(--ink)] shadow-xl backdrop:bg-slate-950/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">{room.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Ensino fundamental · {room.period}</p>
          </div>
          <form method="dialog">
            <button autoFocus className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[var(--blue)]">Fechar</button>
          </form>
        </div>
        <div className="mt-6 rounded-xl bg-[#e8f5f8] p-4">
          <p className="text-sm font-semibold">{room.students} alunos vinculados</p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Os alunos acessam as disciplinas e atividades desta turma.</p>
        </div>
        <h3 className="mt-6 text-sm font-semibold">Professores designados</h3>
        {teachers.length ? (
          <ul className="mt-3 space-y-2">
            {teachers.map((teacher) => <li key={teacher.id} className="rounded-lg border border-[var(--line)] p-3 text-sm">{teacher.name}</li>)}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg bg-[#fff9e5] p-3 text-sm text-[#796413]">Aguardando designação de professor pelo coordenador.</p>
        )}
      </dialog>
    </>
  );
}

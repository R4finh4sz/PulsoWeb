"use client";

import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { SessionUser } from "@/interfaces/auth";
import { useClassroomStore } from "@/store/classroomStore";

export function RemoveTeacher({ user, roomId, teacher }: { user: SessionUser; roomId: string; teacher: SessionUser }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [error, setError] = useState("");
  const removeTeacher = useClassroomStore((state) => state.removeTeacher);

  function confirm() {
    try {
      removeTeacher(user, roomId, teacher.id);
      dialog.current?.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível remover o vínculo.");
    }
  }

  return (
    <>
      <button type="button" aria-label={`Remover ${teacher.name} desta turma`} onClick={() => { setError(""); dialog.current?.showModal(); }} className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-600 text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
      <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-6 text-[var(--ink)] shadow-xl backdrop:bg-slate-950/40">
        <h2 id={titleId} className="text-lg font-semibold">Remover professor</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-[var(--muted)]">Tem certeza que quer remover <strong className="text-[var(--ink)]">{teacher.name}</strong> desta sala?</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button autoFocus type="button" onClick={() => dialog.current?.close()} className="rounded-lg border border-[var(--line)] px-5 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--blue)]">Cancelar</button>
          <button type="button" onClick={confirm} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">Sim</button>
        </div>
      </dialog>
    </>
  );
}

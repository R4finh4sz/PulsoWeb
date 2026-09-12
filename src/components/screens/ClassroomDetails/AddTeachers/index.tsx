"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { SessionUser } from "@/interfaces/auth";
import type { Classroom } from "@/interfaces/classroom";
import { useTeacherStore } from "@/store/teacherStore";
import { useClassroomStore } from "@/store/classroomStore";
import MultiSelect from "@/components/ui/MultiSelect";
import Button from "@/components/ui/Button";

export function AddTeachers({ user, room }: { user: SessionUser; room: Classroom }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const addTeachers = useClassroomStore((state) => state.addTeachers);
  const allTeachers = useTeacherStore((state) => state.teachers);
  const available = allTeachers.filter((person) => person.role === "professor" && !room.teacherIds.includes(person.id));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length) {
      setError("Selecione pelo menos um professor.");
      return;
    }
    try {
      addTeachers(user, room.id, selected);
      setSelected([]);
      setError("");
      setOpen(false);
      setSuccess("Professores vinculados com sucesso.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar os vínculos.");
    }
  }

  return (
    <div className="mb-5">
      <button type="button" aria-expanded={open} aria-controls="add-teachers-form" disabled={!available.length} onClick={() => { setOpen((current) => !current); setError(""); setSuccess(""); setSelected([]); }} className="inline-flex items-center gap-2 rounded-lg bg-[var(--blue)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] disabled:cursor-not-allowed disabled:opacity-50">
        <Plus aria-hidden="true" className="h-4 w-4" />Adicionar professores
      </button>
      {!available.length && <p className="mt-2 text-xs text-[var(--muted)]">Todos os professores disponíveis já estão vinculados.</p>}
      {success && <p role="status" className="mt-3 text-sm text-[var(--blue)]">{success}</p>}
      <div id="add-teachers-form" hidden={!open}>
        {open && <form onSubmit={save} className="mt-4 space-y-4 rounded-xl border border-[var(--line)] bg-slate-50 p-4">
          <MultiSelect id="additional-teachers" name="teacherIds" label="Professores para adicionar" placeholder="Selecione um ou mais professores" options={available.map((person) => ({ value: person.id, label: person.name, description: person.email }))} value={selected} onChange={(ids) => { setSelected(ids); setError(""); }} error={error} />
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => { setOpen(false); setSelected([]); setError(""); }} className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm">Cancelar</button>
            <Button type="submit" className="w-auto px-4">Salvar vínculos</Button>
          </div>
        </form>}
      </div>
    </div>
  );
}

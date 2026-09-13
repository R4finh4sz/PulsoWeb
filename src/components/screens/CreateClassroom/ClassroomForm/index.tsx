"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { SessionUser } from "@/interfaces/auth";
import { useTeacherStore } from "@/store/teacherStore";
import { useCreateClassroom } from "@/hooks/useCreateClassroom";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function ClassroomForm({ user }: { user: SessionUser }) {
  const { values, errors, saving, schools, setField, handleSubmit } = useCreateClassroom(user);
  const allTeachers = useTeacherStore((state) => state.teachers);
  const teachers = allTeachers.filter((person) => person.role === "professor");
  const selectedTeachers = teachers.filter((person) => values.teacherIds.includes(person.id));

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <DashboardPanel id="classroom-data" title="Dados da turma" description="Defina o ano, o identificador e o turno da nova turma.">
          <div className="space-y-5">
            <Select id="schoolId" name="schoolId" label="Escola" value={values.schoolId} onChange={(event) => setField("schoolId", event.target.value)} error={errors.schoolId} required>
              <option value="">Selecione a escola</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </Select>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="year" name="year" label="Ano" placeholder="Ex.: 3" inputMode="numeric" maxLength={1} required value={values.year} onChange={(event) => setField("year", event.target.value)} error={errors.year} aria-describedby="year-help" />
              <Input id="identifier" name="identifier" label="Identificador" placeholder="Ex.: B" maxLength={1} autoCapitalize="characters" required value={values.identifier} onChange={(event) => setField("identifier", event.target.value.toUpperCase())} error={errors.identifier} aria-describedby="identifier-help" />
            </div>
            <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2"><p id="year-help">Um número de 1 ao 3.</p><p id="identifier-help">Uma letra de A a Z.</p></div>
            <Select id="period" name="period" label="Turno" value={values.period} onChange={(event) => setField("period", event.target.value as typeof values.period)} error={errors.period} required>
              <option>Manhã</option><option>Tarde</option><option>Noite</option>
            </Select>
          </div>
        </DashboardPanel>
        <DashboardPanel id="teacher" title="Professores da turma" description="Selecione um ou mais professores para vincular à turma.">
          <MultiSelect
            id="teacherIds"
            name="teacherIds"
            label="Professores"
            placeholder="Selecione um ou mais professores"
            options={teachers.map((person) => ({ value: person.id, label: person.name, description: person.email }))}
            value={values.teacherIds}
            onChange={(ids) => setField("teacherIds", ids)}
            error={errors.teacherIds}
          />
        </DashboardPanel>
        {!schools.length && <p role="alert" className="text-sm text-red-700">Você precisa estar vinculado a uma escola para criar turmas.</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/coordenador/turmas" className="rounded-md border border-[var(--line)] px-6 py-3 text-center text-sm">Cancelar</Link>
          <Button type="submit" disabled={saving || !schools.length} className="sm:w-auto sm:px-8">{saving ? "Salvando…" : "Criar turma"}</Button>
        </div>
      </div>
      <aside className="rounded-2xl border border-[var(--line)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Prévia da turma</p>
        <span className="mt-5 inline-flex rounded-xl bg-[#fff6d5] p-3 text-[#866b00]"><BookOpen aria-hidden="true" className="h-6 w-6" /></span>
        <h2 className="mt-4 text-2xl font-semibold">{values.year || "—"}º ano {values.identifier || "—"}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{values.period} · Ensino médio</p>
        <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5 text-sm">
          <p>{schools.find((school) => school.id === values.schoolId)?.name || "Selecione uma escola"}</p>
          <p className="text-[var(--muted)]">{selectedTeachers.map((person) => person.name).join(", ") || "Professores a definir"}</p>
          <p className="text-xs text-[var(--muted)]">A turma será criada sem alunos. Os professores selecionados já ficarão vinculados a ela.</p>
        </div>
      </aside>
    </form>
  );
}

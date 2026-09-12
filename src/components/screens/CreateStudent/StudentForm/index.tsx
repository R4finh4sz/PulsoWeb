"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import type { SessionUser } from "@/interfaces/auth";
import { useCreateStudent } from "@/hooks/useCreateStudent";
import { useSchoolStore } from "@/store/schoolStore";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function StudentForm({ user }: { user: SessionUser }) {
  const { values, errors, error, saving, rooms, setField, handleSubmit } = useCreateStudent(user);
  const schools = useSchoolStore((state) => state.schools);
  const selectedRoom = rooms.find((room) => room.id === values.classroomId);
  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <DashboardPanel id="student-data" title="Dados do aluno" description="Preencha as informações para cadastrar o aluno.">
          <div className="space-y-5">
            <Input id="name" name="name" label="Nome" placeholder="Nome completo do aluno" autoComplete="name" maxLength={100} required value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
            <Input id="email" name="email" type="email" label="Email" placeholder="aluno@exemplo.com" autoComplete="email" required value={values.email} onChange={(event) => setField("email", event.target.value)} error={errors.email} />
            <Input id="enrollment" name="enrollment" label="Matrícula" placeholder="Ex.: 20260001" maxLength={50} required value={values.enrollment} onChange={(event) => setField("enrollment", event.target.value)} error={errors.enrollment} />
          </div>
        </DashboardPanel>
        <DashboardPanel id="student-classroom" title="Vínculo com a turma" description="Selecione uma das turmas já cadastradas sob sua coordenação.">
          <Select id="classroomId" name="classroomId" label="Turma" required disabled={!rooms.length} value={values.classroomId} onChange={(event) => setField("classroomId", event.target.value)} error={errors.classroomId}>
            <option value="">Selecione a turma</option>
            {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.period} · {schools.find((school) => school.id === room.schoolId)?.name}</option>)}
          </Select>
          {!rooms.length && <p role="status" className="mt-4 text-sm text-[var(--muted)]">Nenhuma turma disponível. <Link href="/coordenador/turmas/nova" className="text-[var(--blue)] underline">Crie uma turma</Link> para cadastrar alunos.</p>}
        </DashboardPanel>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/coordenador#students" className="rounded-md border border-[var(--line)] px-6 py-3 text-center text-sm">Cancelar</Link>
          <Button type="submit" disabled={saving || !rooms.length} className="sm:w-auto sm:px-8">{saving ? "Salvando…" : "Criar aluno"}</Button>
        </div>
      </div>
      <aside className="min-w-0 rounded-2xl border border-[var(--line)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Prévia do aluno</p>
        <span className="mt-5 inline-flex rounded-xl bg-[#e8f5f8] p-3 text-[var(--blue)]"><UserRound aria-hidden="true" className="h-6 w-6" /></span>
        <h2 className="mt-4 break-words text-2xl font-semibold">{values.name.trim() || "Nome do aluno"}</h2>
        <p className="mt-2 break-words text-sm text-[var(--muted)]">{values.email.trim() || "Email a definir"}</p>
        <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5 text-sm">
          <p className="break-words">Matrícula: {values.enrollment.trim() || "—"}</p>
          <p>{selectedRoom ? `${selectedRoom.name} · ${selectedRoom.period}` : "Selecione uma turma"}</p>
          {selectedRoom && <p className="text-[var(--muted)]">{schools.find((school) => school.id === selectedRoom.schoolId)?.name}</p>}
        </div>
      </aside>
    </form>
  );
}

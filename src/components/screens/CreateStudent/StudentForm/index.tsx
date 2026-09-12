"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import type { SessionUser } from "@/interfaces/auth";
import { useCreateStudent } from "@/hooks/useCreateStudent";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useClassroomStore } from "@/store/classroomStore";
import { useSchoolStore } from "@/store/schoolStore";
import { getClassroomsForUser } from "@/services/dashboard";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function StudentForm({ user }: { user: SessionUser }) {
  const { values, errors, error, saving, setField, handleSubmit } = useCreateStudent(user);
  const allRooms = useClassroomStore((state) => state.rooms);
  const schools = useSchoolStore((state) => state.schools);
  const rooms = getClassroomsForUser(user, allRooms, schools);
  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <DashboardPanel id="teacher-data" title="Dados do aluno" description="Preencha os dados da aluno.">
          <div className="space-y-5">
            <Input id="name" name="name" label="Nome completo" placeholder="Nome e sobrenome" autoComplete="name" required maxLength={150} value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="email" name="email" label="Email" type="email" autoComplete="email" placeholder="aluno@exemplo.com" required value={values.email} onChange={(event) => setField("email", event.target.value)} error={errors.email} />
              <Input id="enrollment" name="enrollment" label="Matrícula" placeholder="Ex.: 20260001" required maxLength={50} value={values.enrollment} onChange={(event) => setField("enrollment", event.target.value)} error={errors.enrollment} />
            </div>
          </div>
        </DashboardPanel>
        <DashboardPanel id="student-classroom" title="Vínculo com a turma" description="Selecione uma turma já cadastrada sob sua coordenação.">
          <Select id="classroomId" name="classroomId" label="Turma" required disabled={!rooms.length} value={values.classroomId} onChange={(event) => setField("classroomId", event.target.value)} error={errors.classroomId}>
            <option value="">Selecione a turma</option>
            {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.period} · {schools.find((school) => school.id === room.schoolId)?.name}</option>)}
          </Select>
          {!rooms.length && <p role="status" className="mt-4 text-sm text-[var(--muted)]">Nenhuma turma disponível. <Link href="/coordenador/turmas/nova" className="text-[var(--blue)] underline">Crie uma turma</Link> para cadastrar alunos.</p>}
        </DashboardPanel>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/coordenador#students" className="rounded-lg border border-[var(--line)] px-6 py-3 text-center text-sm">Cancelar</Link>
          <Button type="submit" disabled={saving || !rooms.length} className="sm:w-auto sm:px-8">{saving ? "Salvando…" : "Criar aluno"}</Button>
        </div>
      </div>
      <aside className="min-w-0 rounded-2xl border border-[var(--line)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Prévia do aluno</p>
        <span className="mt-5 inline-flex rounded-xl bg-[#e8f5f8] p-3 text-[var(--blue)]"><UserRound aria-hidden="true" className="h-6 w-6" /></span>
        <h2 className="mt-4 break-words text-xl font-semibold">{values.name || "Nome completo"}</h2>
        <p className="mt-2 break-words text-sm text-[var(--muted)]">Matrícula: {values.enrollment || "A informar"}</p>
        <p className="mt-3 break-words text-sm text-[var(--muted)]">Email: {values.email || "A informar"}</p>
        <p className="mt-5 rounded-xl bg-[#e8f5f8] p-3 text-xs leading-5">O aluno será vinculado à turma selecionada.</p>
      </aside>
    </form>
  );
}


"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import type { SessionUser } from "@/interfaces/auth";
import { useCreateTeacher } from "@/hooks/useCreateTeacher";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function TeacherForm({ user }: { user: SessionUser }) {
  const { values, errors, error, saving, setField, handleSubmit } = useCreateTeacher(user);
  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <DashboardPanel id="teacher-data" title="Dados do professor" description="Preencha os dados da pessoa que acompanhará as turmas.">
          <div className="space-y-5">
            <Input id="name" name="name" label="Nome completo" placeholder="Nome e sobrenome" autoComplete="name" required maxLength={150} value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="email" name="email" label="Email" type="email" autoComplete="email" placeholder="professor@exemplo.com" required value={values.email} onChange={(event) => setField("email", event.target.value)} error={errors.email} />
              <Input id="registration" name="registration" label="Matrícula" placeholder="Ex.: PROF-001" required maxLength={30} value={values.registration} onChange={(event) => setField("registration", event.target.value)} error={errors.registration} />
            </div>
          </div>
        </DashboardPanel>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/coordenador/professores" className="rounded-lg border border-[var(--line)] px-6 py-3 text-center text-sm">Cancelar</Link>
          <Button type="submit" disabled={saving} className="sm:w-auto sm:px-8">{saving ? "Salvando…" : "Criar professor"}</Button>
        </div>
      </div>
      <aside className="min-w-0 rounded-2xl border border-[var(--line)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Prévia do professor</p>
        <span className="mt-5 inline-flex rounded-xl bg-[#e8f5f8] p-3 text-[var(--blue)]"><UserRound aria-hidden="true" className="h-6 w-6" /></span>
        <h2 className="mt-4 break-words text-xl font-semibold">{values.name || "Nome completo"}</h2>
        <p className="mt-2 break-words text-sm text-[var(--muted)]">Matrícula: {values.registration || "A informar"}</p>
        <p className="mt-3 break-words text-sm text-[var(--muted)]">Email: {values.email || "A informar"}</p>
        <p className="mt-5 rounded-xl bg-[#e8f5f8] p-3 text-xs leading-5">Após o cadastro, este professor estará disponível para vincular às turmas.</p>
      </aside>
    </form>
  );
}


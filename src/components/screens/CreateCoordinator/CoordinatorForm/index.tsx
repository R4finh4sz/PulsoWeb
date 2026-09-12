"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import type { SessionUser } from "@/interfaces/auth";
import { useCreateCoordinator } from "@/hooks/useCreateCoordinator";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function CoordinatorForm({ user }: { user: SessionUser }) {
  const { values, errors, error, saving, setField, handleSubmit } = useCreateCoordinator(user);
  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <DashboardPanel id="coordinator-data" title="Dados do coordenador" description="Preencha os dados da liderança pedagógica.">
          <div className="space-y-5">
            <Input id="name" name="name" label="Nome completo" placeholder="Nome e sobrenome" autoComplete="name" required maxLength={150} value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="birthDate" name="birthDate" label="Data de nascimento" type="date" autoComplete="bday" required value={values.birthDate} onChange={(event) => setField("birthDate", event.target.value)} error={errors.birthDate} />
              <Input id="registration" name="registration" label="Matrícula" placeholder="Ex.: COORD-001" required maxLength={30} value={values.registration} onChange={(event) => setField("registration", event.target.value)} error={errors.registration} />
            </div>
          </div>
        </DashboardPanel>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/admin#coordinators" className="rounded-lg border border-[var(--line)] px-6 py-3 text-center text-sm">Cancelar</Link>
          <Button type="submit" disabled={saving} className="sm:w-auto sm:px-8">{saving ? "Salvando…" : "Criar coordenador"}</Button>
        </div>
      </div>
      <aside className="rounded-2xl border border-[var(--line)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Prévia do coordenador</p>
        <span className="mt-5 inline-flex rounded-xl bg-[#e8f5f8] p-3 text-[var(--blue)]"><UserRound aria-hidden="true" className="h-6 w-6" /></span>
        <h2 className="mt-4 break-words text-xl font-semibold">{values.name || "Nome completo"}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Matrícula: {values.registration || "A informar"}</p>
        <p className="mt-3 text-sm text-[var(--muted)]">Nascimento: {values.birthDate ? values.birthDate.split("-").reverse().join("/") : "A informar"}</p>
        <p className="mt-5 rounded-xl bg-[#e8f5f8] p-3 text-xs leading-5">Após o cadastro, este coordenador estará disponível para vincular a uma escola.</p>
      </aside>
    </form>
  );
}


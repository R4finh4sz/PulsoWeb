"use client";

import Link from "next/link";
import { School } from "lucide-react";
import { useCreateSchool } from "@/hooks/useCreateSchool";
import { states } from "@/validation/School.validation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function SchoolForm() {
  const { values, errors, saving, setField, handleSubmit } = useCreateSchool();
  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <DashboardPanel id="school-data" title="Dados da escola" description="Identifique a instituição que fará parte da sua rede.">
          <div className="space-y-5">
            <Input id="name" name="name" label="Nome" placeholder="Nome da escola" autoComplete="organization" required maxLength={150} value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
            <Input id="cnpj" name="cnpj" label="CNPJ" placeholder="00.000.000/0000-00" autoCapitalize="characters" spellCheck={false} required maxLength={18} value={values.cnpj} onChange={(event) => setField("cnpj", event.target.value.toUpperCase())} error={errors.cnpj} />
          </div>
        </DashboardPanel>
        <DashboardPanel id="address" title="Endereço" description="Informe onde a escola está localizada.">
          <div className="space-y-5">
            <Input id="street" name="street" label="Logradouro" placeholder="Rua, avenida ou outro logradouro" autoComplete="street-address" required maxLength={200} value={values.street} onChange={(event) => setField("street", event.target.value)} error={errors.street} />
            <Input id="neighborhood" name="neighborhood" label="Bairro" placeholder="Nome do bairro" autoComplete="address-level2" required maxLength={100} value={values.neighborhood} onChange={(event) => setField("neighborhood", event.target.value)} error={errors.neighborhood} />
            <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
              <Select id="state" name="state" label="Estado" autoComplete="address-level1" required value={values.state} onChange={(event) => setField("state", event.target.value)} error={errors.state}>
                <option value="">Selecione</option>
                {states.map((state) => <option key={state} value={state}>{state}</option>)}
              </Select>
              <Input id="city" name="city" label="Cidade" placeholder="Nome da cidade" autoComplete="address-level2" required maxLength={100} value={values.city} onChange={(event) => setField("city", event.target.value)} error={errors.city} />
            </div>
          </div>
        </DashboardPanel>
      
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/admin#schools" className="rounded-lg border border-[var(--line)] px-6 py-3 text-center text-sm">Cancelar</Link>
          <Button type="submit" disabled={saving} className="sm:w-auto sm:px-8">{saving ? "Salvando…" : "Criar escola"}</Button>
        </div>
      </div>
      <aside className="rounded-2xl border border-[var(--line)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Prévia da escola</p>
        <span className="mt-5 inline-flex rounded-xl bg-[#e8f5f8] p-3 text-[var(--blue)]"><School aria-hidden="true" className="h-6 w-6" /></span>
        <h2 className="mt-4 break-words text-xl font-semibold">{values.name || "Nome da escola"}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{values.cnpj || "CNPJ a informar"}</p>
        <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
          <p className="break-words">{values.street || "Logradouro a informar"}</p>
          <p>{[values.city, values.state].filter(Boolean).join(" · ") || "Cidade e estado"}</p>
        </div>
        <p className="mt-5 rounded-xl bg-[#e8f5f8] p-3 text-xs leading-5">Coordenação: --</p>
      </aside>
    </form>
  );
}

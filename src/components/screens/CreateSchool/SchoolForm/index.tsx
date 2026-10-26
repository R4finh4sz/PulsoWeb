"use client";

import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useCreateSchool } from "@/hooks/useCreateSchool";
import { formatCnpj } from "@/utils/cnpj";
import { findAddressByCep, formatCep } from "@/utils/viacep";
import { states } from "@/validation/School.validation";
import { School } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type AddressField = "street" | "neighborhood" | "state" | "city";
const addressFields: AddressField[] = ["street", "neighborhood", "state", "city"];

export function SchoolForm() {
  const { values, errors, saving, setField, handleSubmit } = useCreateSchool();
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "found" | "manual">("idle");
  const [lockedFields, setLockedFields] = useState<Record<AddressField, boolean>>({ street: false, neighborhood: false, state: false, city: false });
  const cepDigits = values.cep.replace(/\D/g, "");
  const addressBlocked = cepStatus !== "manual" && cepStatus !== "found";

  useEffect(() => {
    if (cepDigits.length !== 8) return;
    const controller = new AbortController();
    findAddressByCep(cepDigits, controller.signal)
      .then(address => {
        if (!address) {
          setLockedFields({ street: false, neighborhood: false, state: false, city: false });
          setCepStatus("manual");
          return;
        }
        const addressValues: Record<AddressField, string> = {
          street: address.logradouro || "",
          neighborhood: address.bairro || "",
          city: address.localidade || "",
          state: address.uf || "",
        };
        for (const field of addressFields) setField(field, addressValues[field]);
        setLockedFields({
          street: Boolean(addressValues.street),
          neighborhood: Boolean(addressValues.neighborhood),
          state: Boolean(addressValues.state),
          city: Boolean(addressValues.city),
        });
        setCepStatus("found");
      })
        .catch(() => {
          if (!controller.signal.aborted) {
            setLockedFields({ street: false, neighborhood: false, state: false, city: false });
            setCepStatus("manual");
          }
      });
    return () => controller.abort();
  }, [cepDigits, setField]);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <DashboardPanel id="school-data" title="Dados da escola" description="Identifique a instituição que fará parte da sua rede.">
          <div className="space-y-5">
            <Input id="name" name="name" label="Nome" placeholder="Nome da escola" autoComplete="organization" required maxLength={150} value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
            <Input id="cnpj" name="cnpj" label="CNPJ" placeholder="00.000.000/0000-00" autoCapitalize="characters" spellCheck={false} required maxLength={18} value={values.cnpj} onChange={(event) => setField("cnpj", formatCnpj(event.target.value))} error={errors.cnpj} />
          </div>
        </DashboardPanel>
        <DashboardPanel id="address" title="Endereço" description="Informe onde a escola está localizada.">
          <div className="space-y-5">
            <Input id="cep" name="cep" label="CEP" placeholder="00000-000" autoComplete="postal-code" inputMode="numeric" required maxLength={9} value={values.cep} onChange={(event) => { const formattedCep = formatCep(event.target.value); const complete = formattedCep.replace(/\D/g, "").length === 8; setLockedFields({ street: true, neighborhood: true, state: true, city: true }); setCepStatus(complete ? "loading" : "idle"); setField("cep", formattedCep); }} error={errors.cep} />
            {cepStatus === "loading" && <p className="-mt-3 text-xs text-(--muted)">Buscando endereço pelo CEP…</p>}
            {cepStatus === "manual" && <p className="-mt-3 text-xs text-(--muted)">Não foi possível localizar o endereço. Preencha os campos manualmente.</p>}
            <Input id="street" name="street" label="Logradouro" placeholder="Rua, avenida ou outro logradouro" autoComplete="street-address" required maxLength={200} value={values.street} onChange={(event) => setField("street", event.target.value)} error={errors.street} disabled={addressBlocked || lockedFields.street} />
            <Input id="neighborhood" name="neighborhood" label="Bairro" placeholder="Nome do bairro" autoComplete="address-level2" required maxLength={100} value={values.neighborhood} onChange={(event) => setField("neighborhood", event.target.value)} error={errors.neighborhood} disabled={addressBlocked || lockedFields.neighborhood} />
            <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
              <Select id="state" name="state" label="Estado" autoComplete="address-level1" required value={values.state} onChange={(event) => setField("state", event.target.value)} error={errors.state} disabled={addressBlocked || lockedFields.state}>
                <option value="">Selecione</option>
                {states.map((state) => <option key={state} value={state}>{state}</option>)}
              </Select>
              <Input id="city" name="city" label="Cidade" placeholder="Nome da cidade" autoComplete="address-level2" required maxLength={100} value={values.city} onChange={(event) => setField("city", event.target.value)} error={errors.city} disabled={addressBlocked || lockedFields.city} />
            </div>
          </div>
        </DashboardPanel>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/admin#schools" className="rounded-lg border border-(--line) px-6 py-3 text-center text-sm">Cancelar</Link>
          <Button type="submit" disabled={saving} className="sm:w-auto sm:px-8">{saving ? "Salvando…" : "Criar escola"}</Button>
        </div>
      </div>
      <aside className="rounded-2xl border border-(--line) bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-(--muted)">Prévia da escola</p>
        <span className="mt-5 inline-flex rounded-xl bg-[#e8f5f8] p-3 text-(--blue)"><School aria-hidden="true" className="h-6 w-6" /></span>
        <h2 className="mt-4 wrap-break-word text-xl font-semibold">{values.name || "Nome da escola"}</h2>
        <p className="mt-2 text-sm text-(--muted)">{values.cnpj || "CNPJ a informar"}</p>
        <div className="mt-5 space-y-3 border-t border-(--line) pt-5 text-sm text-(--muted)">
          <p className="wrap-break-word">{values.street || "Logradouro a informar"}</p>
          <p>{[values.city, values.state].filter(Boolean).join(" · ") || "Cidade e estado"}</p>
        </div>
      </aside>
    </form>
  );
}

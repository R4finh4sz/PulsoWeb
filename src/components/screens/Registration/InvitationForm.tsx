"use client";
import Button from "@/components/ui/Button";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import Input from "@/components/ui/Input";
import { registrationApi } from "@/integrations/registration/api";
import { useSchools } from "@/integrations/schools/hooks";
import { useApiMutation } from "@/integrations/useApiMutation";
import { findAddressByCep, formatCep, type ViaCepAddress } from "@/utils/viacep";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { ErrorMessage, Protected, Workspace } from "../Integration/shared";

export function InvitationPage({ resource }: { resource: "teachers" | "coordinators" }) {
  return <Protected role={resource === "coordinators" ? "admin" : "coordenador"}>{user => <Workspace user={user} title={resource === "coordinators" ? "Convidar coordenador" : "Convidar professor"}><InvitationForm resource={resource} /></Workspace>}</Protected>;
}
function InvitationForm({ resource }: { resource: "teachers" | "coordinators" }) {
  const schools = useSchools(resource === "coordinators");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolAddress, setSchoolAddress] = useState<ViaCepAddress | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false);
  const schoolMenu = useRef<HTMLDivElement>(null);
  const mutation = useApiMutation((body: { email: string; schoolId?: number }) => registrationApi.invite(resource, body));
  const normalize = (value: string | undefined) => value?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || "";
  const filteredSchools = schools.data?.filter(school => {
    const search = normalize(schoolSearch);
    const digits = schoolSearch.replace(/\D/g, "");
    const matchesName = Boolean(search && normalize(school.nome).includes(search));
    const matchesCnpj = Boolean(digits && school.cnpj.replace(/\D/g, "").includes(digits));
    if (search && !schoolAddress && !matchesName && !matchesCnpj) return false;
    if (!schoolAddress) return true;
    return [[schoolAddress.logradouro, school.logradouro], [schoolAddress.bairro, school.bairro], [schoolAddress.localidade, school.cidade]]
      .filter(([addressValue]) => addressValue)
      .every(([addressValue, schoolValue]) => {
        const address = normalize(addressValue);
        const schoolName = normalize(schoolValue);
        return schoolName === address || schoolName.includes(address) || address.includes(schoolName);
      });
  });
  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (!schoolMenu.current?.contains(event.target as Node)) setSchoolMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);
  async function searchSchoolByCep(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSchoolSearch(value);
    setSelectedSchoolId("");
    setSchoolAddress(null);
    const cep = value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    const address = await findAddressByCep(formatCep(value).replace(/\D/g, ""));
    setSchoolAddress(address);
  }
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); if (mutation.isPending) return;
    const form = event.currentTarget; const data = new FormData(form);
    try { await mutation.mutateAsync({ email: String(data.get("email")).trim(), ...(resource === "coordinators" ? { schoolId: Number(selectedSchoolId) } : {}) }); form.reset(); setSchoolSearch(""); setSchoolAddress(null); setSelectedSchoolId(""); } catch { }
  }
  return <form onSubmit={submit} className="max-w-2xl space-y-6"><DashboardPanel id="invitation-data" title="Convite por e-mail" description="O destinatário receberá um link para confirmar o e-mail e preencher o cadastro. A solicitação será enviada para análise."><div className="space-y-5">
    <Input id="email" name="email" label="E-mail" type="email" autoComplete="email" required maxLength={254} />
    {resource === "coordinators" && <div ref={schoolMenu} className="relative"><label htmlFor="school-search" className="block text-xs font-bold text-(--ink)">Escola</label><input type="hidden" name="schoolId" value={selectedSchoolId} required /><button type="button" id="school-search" aria-expanded={schoolMenuOpen} onClick={() => setSchoolMenuOpen(value => !value)} className="mt-2 flex h-12 w-full items-center justify-between rounded-md border border-(--line) bg-white px-4 text-left text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15"><span className={selectedSchoolId ? "" : "text-(--muted)"}>{schools.data?.find(school => String(school.id) === selectedSchoolId)?.nome || "Selecione a escola"}</span><ChevronDown aria-hidden="true" className="h-4 w-4" /></button>{schoolMenuOpen && <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-lg border border-(--line) bg-white p-2 shadow-lg"><label className="flex items-center gap-2 rounded-md border border-(--line) px-3 py-2"><Search aria-hidden="true" className="h-4 w-4 text-(--muted)" /><input autoFocus value={schoolSearch} onChange={searchSchoolByCep} placeholder="Nome, CNPJ ou CEP" className="min-w-0 flex-1 text-sm outline-none" /></label><div className="mt-2 max-h-56 overflow-y-auto">{filteredSchools?.map(school => <button type="button" key={school.id} onClick={() => { setSelectedSchoolId(String(school.id)); setSchoolMenuOpen(false); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#e8f5f8]">{school.nome}<span className="mt-1 block text-xs text-(--muted)">{school.cnpj || "CNPJ não informado"} · {school.cidade}</span></button>)}{schools.isPending && <p className="p-3 text-sm text-(--muted)">Carregando escolas…</p>}{schools.data && !filteredSchools?.length && <p className="p-3 text-sm text-(--muted)">Nenhuma escola encontrada.</p>}</div></div>}<ErrorMessage error={schools.error} /></div>}
    <Button type="submit" disabled={mutation.isPending || (resource === "coordinators" && !schools.data?.length)}>{mutation.isPending ? "Enviando…" : "Enviar convite"}</Button>
    {mutation.isSuccess && <p role="status" className="text-sm text-(--blue)">Convite enviado por e-mail.</p>}
  </div></DashboardPanel></form>;
}

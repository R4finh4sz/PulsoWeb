"use client";

import { ErrorMessage } from "@/components/screens/Integration/shared";
import type { School } from "@/integrations/schools/api";
import { normalizeAddress } from "@/utils/text";
import { findAddressByCep, formatCep, type ViaCepAddress } from "@/utils/viacep";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

export function InvitationSchoolSelector({ schools, loading, error, value, onChange }: {
  schools: School[] | undefined;
  loading: boolean;
  error: unknown;
  value: string;
  onChange: (value: string) => void;
}) {
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolAddress, setSchoolAddress] = useState<ViaCepAddress | null>(
    null,
  );
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false);
  const schoolMenu = useRef<HTMLDivElement>(null);
  const filteredSchools = schools?.filter((school) => {
    const search = normalizeAddress(schoolSearch);
    const digits = schoolSearch.replace(/\D/g, "");
    const matchesName = Boolean(
      search && normalizeAddress(school.nome).includes(search),
    );
    const matchesCnpj = Boolean(
      digits && school.cnpj.replace(/\D/g, "").includes(digits),
    );
    if (search && !schoolAddress && !matchesName && !matchesCnpj) return false;
    if (!schoolAddress) return true;
    return [
      [schoolAddress.logradouro, school.logradouro],
      [schoolAddress.bairro, school.bairro],
      [schoolAddress.localidade, school.cidade],
    ]
      .filter(([addressValue]) => addressValue)
      .every(([addressValue, schoolValue]) => {
        const address = normalizeAddress(addressValue);
        const schoolName = normalizeAddress(schoolValue);
        return (
          schoolName === address ||
          schoolName.includes(address) ||
          address.includes(schoolName)
        );
      });
  });
  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (!schoolMenu.current?.contains(event.target as Node))
        setSchoolMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);
  async function searchSchoolByCep(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSchoolSearch(value);
    onChange("");
    setSchoolAddress(null);
    const cep = value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    const address = await findAddressByCep(formatCep(value).replace(/\D/g, ""));
    setSchoolAddress(address);
  }

  return (
    <div ref={schoolMenu} className="relative">
      <label
        htmlFor="school-search"
        className="block text-xs font-bold text-(--ink)"
      >
        Escola
      </label>
      <input
        type="hidden"
        name="schoolId"
        value={value}
        required
      />
      <button
        type="button"
        id="school-search"
        aria-expanded={schoolMenuOpen}
        onClick={() => setSchoolMenuOpen((value) => !value)}
        className="mt-2 flex h-12 w-full items-center justify-between rounded-md border border-(--line) bg-white px-4 text-left text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15"
      >
        <span className={value ? "" : "text-(--muted)"}>
          {schools?.find(
            (school) => String(school.id) === value,
          )?.nome || "Selecione a escola"}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
      {schoolMenuOpen && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-lg border border-(--line) bg-white p-2 shadow-lg">
          <label className="flex items-center gap-2 rounded-md border border-(--line) px-3 py-2">
            <Search
              aria-hidden="true"
              className="h-4 w-4 text-(--muted)"
            />
            <input
              autoFocus
              value={schoolSearch}
              onChange={searchSchoolByCep}
              placeholder="Nome, CNPJ ou CEP"
              className="min-w-0 flex-1 text-sm outline-none"
            />
          </label>
          <div className="mt-2 max-h-56 overflow-y-auto">
            {filteredSchools?.map((school) => (
              <button
                type="button"
                key={school.id}
                onClick={() => {
                  onChange(String(school.id));
                  setSchoolMenuOpen(false);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#e8f5f8]"
              >
                {school.nome}
                <span className="mt-1 block text-xs text-(--muted)">
                  {school.cnpj || "CNPJ não informado"} ·{" "}
                  {school.cidade}
                </span>
              </button>
            ))}
            {loading && (
              <p className="p-3 text-sm text-(--muted)">
                Carregando escolas…
              </p>
            )}
            {schools && !filteredSchools?.length && (
              <p className="p-3 text-sm text-(--muted)">
                Nenhuma escola encontrada.
              </p>
            )}
          </div>
        </div>
      )}
      <ErrorMessage error={error} />
    </div>
  );
}

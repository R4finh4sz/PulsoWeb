"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  options: { value: string; label: string; description?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
};

export default function MultiSelect({ id, name, label, placeholder = "Selecione as opções", options, value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = options.filter((option) => value.includes(option.value));

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  return (
    <div ref={root} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }}>
      <label htmlFor={id} className="block text-xs font-bold text-[var(--ink)]">{label}</label>
      <button
        ref={trigger}
        id={id}
        name={name}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        data-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-white px-4 py-3 text-left text-sm outline-none focus-visible:border-[var(--blue)] focus-visible:ring-2 focus-visible:ring-[var(--blue)]/15 data-[invalid=true]:border-red-600"
      >
        <span className={selected.length ? "" : "text-[var(--muted)]"}>{selected.length ? selected.map((option) => option.label).join(", ") : placeholder}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={`${id}-options`} hidden={!open} className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-lg border border-[var(--line)] bg-white p-2 shadow-lg">
        <fieldset>
          <legend className="sr-only">{label}</legend>
          {options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 hover:bg-slate-50 has-checked:bg-[#e8f5f8]">
              <input type="checkbox" checked={value.includes(option.value)} onChange={(event) => onChange(event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value))} className="h-4 w-4 shrink-0 accent-[var(--blue)]" />
              <span className="min-w-0"><span className="block text-sm">{option.label}</span>{option.description && <span className="mt-1 block break-all text-xs text-[var(--muted)]">{option.description}</span>}</span>
            </label>
          ))}
          {!options.length && <p className="p-3 text-sm text-[var(--muted)]">Nenhuma opção disponível.</p>}
        </fieldset>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

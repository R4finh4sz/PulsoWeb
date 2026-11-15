"use client";

import { authApi, type Terms } from "@/integrations/auth/api";
import { legalApi, type LegalDocument } from "@/integrations/legal/api";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function useAcceptanceDocuments(termsKey: string[] = ["terms"], student = false) {
  const terms = useQuery({
    queryKey: [...termsKey, student ? "student" : "general"],
    queryFn: ({ signal }) => student ? legalApi.current("student", signal) : authApi.terms(signal),
    staleTime: 0,
  });
  const privacy = useQuery({
    queryKey: ["legal-document", "privacy", student],
    queryFn: async ({ signal }) => { const policy = await legalApi.current("privacy", signal); if (!policy && student) throw new Error("A política de privacidade precisa ser publicada para continuar."); return policy; },
    staleTime: 0,
  });
  const key = terms.data
    ? `${terms.data.version}|${privacy.data?.version ?? ""}`
    : null;
  return { terms, privacy, key };
}

export const acceptanceLabel = (hasPrivacy: boolean, student = false) => student ? "Li e aceito o termo do aluno e a política de privacidade." :
  hasPrivacy
    ? "Li e aceito os termos de uso e a política de privacidade."
    : "Li e aceito os termos de uso.";

export function AcceptanceReader({
  terms,
  privacy,
  maxHeight = "max-h-[40dvh]", student = false,
}: {
  terms: Terms;
  privacy: LegalDocument | null | undefined;
  maxHeight?: string; student?: boolean;
}) {
  const [active, setActive] = useState<"terms" | "privacy">("terms");
  const doc = active === "privacy" && privacy ? privacy : terms;
  const options = [
    { value: "terms" as const, label: student ? "Termo do aluno" : "Termos de uso", icon: FileText },
    ...(privacy
      ? [
          {
            value: "privacy" as const,
            label: "Política de privacidade",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];
  return (
    <div>
      {options.length > 1 && (
        <nav
          aria-label="Documento"
          className="flex gap-2 border-b border-(--line)"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={active === option.value}
              onClick={() => setActive(option.value)}
              className={`flex min-h-11 items-center gap-2 rounded-t-lg border-b-2 px-4 text-sm font-medium ${active === option.value ? "border-(--blue) bg-cyan-50 text-(--blue-dark)" : "border-transparent text-(--muted) hover:bg-slate-50"}`}
            >
              <option.icon size={18} aria-hidden="true" className="shrink-0" />
              {option.label}
            </button>
          ))}
        </nav>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        {active === "privacy" && privacy ? (
          <ShieldCheck size={16} aria-hidden="true" className="shrink-0" />
        ) : (
          <FileText size={16} aria-hidden="true" className="shrink-0" />
        )}
        {doc.title} · Versão {doc.version}
      </p>
      <div
        tabIndex={0}
        className={`mt-2 ${maxHeight} overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-6`}
      >
        {doc.content}
      </div>
    </div>
  );
}

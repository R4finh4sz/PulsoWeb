"use client";

import {
  actionClass,
  fieldClass,
  EmptyState,
  ErrorMessage,
  Protected,
  Workspace,
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import { faqsApi } from "@/integrations/faqs/api";
import { type SessionUser } from "@/interfaces/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, CircleHelp, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { faqRoles } from "./roles";

export function FaqContent({ user }: { user: SessionUser }) {
  const [role, setRole] = useState("");
  const faqs = useQuery({
    queryKey: ["faqs", user.id, user.role],
    queryFn: ({ signal }) => faqsApi.list(signal),
  });
  const visibleFaqs = faqs.data?.filter(
    (faq) => !role || faq.targetRole === role,
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackLink />
        {user.role === "admin" && (
          <Link href="/admin/faq/new" className={actionClass}>
            Criar pergunta
          </Link>
        )}
      </div>
      {user.role === "admin" && (
        <label className="block max-w-xs text-sm font-medium">
          Perfil do FAQ
          <select
            className={fieldClass}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">Todos os perfis</option>
            {Object.entries(faqRoles).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      {faqs.isPending && <p role="status">Carregando perguntas…</p>}
      <ErrorMessage error={faqs.error} />
      {faqs.isError && (
        <button
          type="button"
          className={actionClass}
          onClick={() => faqs.refetch()}
        >
          Tentar novamente
        </button>
      )}
      {faqs.isSuccess && visibleFaqs?.length === 0 && (
        <EmptyState
          icon={CircleHelp}
          title="Nenhuma pergunta disponível para seu perfil."
        />
      )}
      {visibleFaqs?.map((faq, index) => (
        <article
          key={faq.id ?? index}
          className="rounded-xl border border-(--line) bg-white"
        >
          <details className="group min-w-0 px-4 py-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 wrap-break-word">
                {faq.title}
                {user.role === "admin" && (
                  <span className="mt-1 block text-xs font-normal text-(--muted)">
                    {faqRoles[faq.targetRole] ?? faq.targetRole}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {user.role === "admin" && faq.id != null && (
                  <Link
                    href={`/admin/faq/${encodeURIComponent(faq.id)}/edit`}
                    aria-label={`Editar pergunta: ${faq.title}`}
                    title="Editar pergunta"
                    onClick={(event) => event.stopPropagation()}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-(--muted) hover:bg-cyan-50 hover:text-(--blue-dark)"
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </Link>
                )}
                <span className="flex h-11 w-11 items-center justify-center rounded-lg text-(--blue-dark) group-hover:bg-cyan-50">
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    className="group-open:rotate-180"
                  />
                </span>
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm text-(--muted)">
              {faq.message}
            </p>
          </details>
        </article>
      ))}
    </div>
  );
}

export function FaqPage({
  role,
}: {
  role: "aluno" | "professor" | "coordenador" | "admin";
}) {
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace
          user={user}
          title="Perguntas frequentes"
          description="Encontre respostas sobre o uso da plataforma."
        >
          <FaqContent user={user} />
        </Workspace>
      )}
    </Protected>
  );
}

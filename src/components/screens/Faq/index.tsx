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
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { faqsApi, type Faq } from "@/integrations/faqs/api";
import { type SessionUser } from "@/interfaces/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, CircleHelp, Pencil, Trash2 } from "lucide-react";
import { showRequestError } from "@/store/feedbackStore";
import Link from "next/link";
import { useRef, useState } from "react";
import { faqRoles } from "./roles";

export function FaqContent({ user }: { user: SessionUser }) {
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState<Faq | null>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const client = useQueryClient();
  const remove = useMutation({
    mutationFn: faqsApi.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: ["faqs"] }),
    onError: showRequestError,
    onSettled: () => {
      confirmation.current?.close();
      setSelected(null);
    },
  });
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
                  <>
                  <Link
                    href={`/admin/faq/${encodeURIComponent(faq.id)}/edit`}
                    aria-label={`Editar pergunta: ${faq.title}`}
                    title="Editar pergunta"
                    onClick={(event) => event.stopPropagation()}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-(--muted) hover:bg-cyan-50 hover:text-(--blue-dark)"
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Excluir pergunta: ${faq.title}`}
                    title="Excluir pergunta"
                    disabled={remove.isPending}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelected(faq);
                      confirmation.current?.showModal();
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                  </>
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
      <dialog
        ref={confirmation}
        aria-labelledby="faq-delete-title"
        onCancel={(event) => {
          if (remove.isPending) event.preventDefault();
        }}
        onClose={() => setSelected(null)}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-white p-0 backdrop:bg-black/70"
      >
        {selected && (
          <FeedbackModalContent
            type="error"
            title="Excluir pergunta?"
            titleId="faq-delete-title"
            message={`Deseja excluir a pergunta “${selected.title}”? Essa ação não pode ser desfeita.`}
            actionLabel="Cancelar"
            autoFocusAction
            disabled={remove.isPending}
            onClose={() => confirmation.current?.close()}
            secondaryAction={{
              label: remove.isPending ? "Excluindo…" : "Excluir",
              destructive: true,
              onClick: () => {
                if (!remove.isPending && selected.id != null)
                  remove.mutate(selected.id);
              },
            }}
          />
        )}
      </dialog>
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

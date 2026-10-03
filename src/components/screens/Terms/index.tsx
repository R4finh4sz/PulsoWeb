"use client";

import {
  ErrorMessage,
  Protected,
  Workspace,
  actionClass,
  fieldClass,
} from "@/components/screens/Integration/shared";
import Input from "@/components/ui/Input";
import { authApi, type Terms } from "@/integrations/auth/api";
import { homeRoutes, type UserRole } from "@/interfaces/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function TermsEditor({ current }: { current: Terms | null }) {
  const [title, setTitle] = useState(current?.title ?? "Termos de uso");
  const [content, setContent] = useState(current?.content ?? "");
  const [validation, setValidation] = useState<string | null>(null);
  const client = useQueryClient();
  const router = useRouter();
  const save = useMutation({
    mutationFn: (body: Pick<Terms, "title" | "content">) =>
      current ? authApi.updateTerms(body) : authApi.createTerms(body),
    onSuccess: async (published) => {
      router.replace("/admin/terms");
      client.setQueryData(["terms"], published);
      await client.invalidateQueries({ queryKey: ["terms-accepted"] });
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (save.isPending) return;
    if (!title.trim() || !content.trim()) {
      setValidation("Preencha o título e o conteúdo dos termos.");
      return;
    }
    setValidation(null);
    save.mutate({ title: title.trim(), content: content.trim() });
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-(--line) bg-white p-5 sm:p-8"
    >
      <div>
        <h2 className="text-lg font-semibold">
          {current ? "Editar termos de uso" : "Criar termos de uso"}
        </h2>
        <p className="mt-2 text-sm text-(--muted)">
          Ao publicar, uma nova versão ficará disponível para todos os usuários
          e será solicitado o aceite.
        </p>
      </div>
      <fieldset disabled={save.isPending} className="space-y-5">
        <Input
          id="terms-title"
          label="Título"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
        />
        <div>
          <label htmlFor="terms-content" className="block text-xs font-bold">
            Conteúdo dos termos
          </label>
          <textarea
            id="terms-content"
            className={`${fieldClass} min-h-80 resize-y leading-7`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            rows={16}
          />
        </div>
      </fieldset>
      {validation && (
        <p role="alert" className="text-sm text-red-700">
          {validation}
        </p>
      )}
      <ErrorMessage error={save.error} />
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className={actionClass} disabled={save.isPending}>
          {save.isPending
            ? "Publicando…"
            : current
              ? "Publicar nova versão"
              : "Publicar termos"}
        </button>
        {!save.isPending && (
          <Link href="/admin/terms" className="text-sm text-(--blue)">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}

function TermsContent({ role, edit }: { role: UserRole; edit: boolean }) {
  const terms = useQuery({
    queryKey: ["terms"],
    queryFn: ({ signal }) => authApi.terms(signal),
  });
  if (terms.isPending) return <p role="status">Carregando termos de uso…</p>;
  if (terms.isError)
    return (
      <div className="space-y-4">
        <ErrorMessage error={terms.error} />
        <button className={actionClass} onClick={() => void terms.refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  const current = terms.data;
  if (edit && role === "admin") return <TermsEditor current={current} />;
  return (
    <section className="space-y-5 rounded-2xl border border-(--line) bg-white p-5 sm:p-8">
      {current ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="wrap-break-word text-xl font-semibold">
                {current.title}
              </h2>
              <p className="mt-2 text-sm text-(--muted)">
                Versão atual: {current.version}
              </p>
            </div>
            {role === "admin" && (
              <Link href="/admin/terms/editar" className={actionClass}>
                Editar termos
              </Link>
            )}
          </div>
          <div className="whitespace-pre-wrap wrap-break-word border-t border-(--line) pt-5 text-sm leading-7">
            {current.content}
          </div>
        </>
      ) : (
        <div className="space-y-4 py-8 text-center">
          <h2 className="text-lg font-semibold">
            Nenhum termo de uso cadastrado.
          </h2>
          <p className="text-sm text-(--muted)">
            {role === "admin"
              ? "Crie os termos de uso para disponibilizá-los aos usuários da plataforma."
              : "Os termos de uso estarão disponíveis aqui assim que forem publicados."}
          </p>
          {role === "admin" && (
            <Link
              href="/admin/terms/editar"
              className={`${actionClass} inline-block`}
            >
              Criar termos
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export function TermsScreen({
  role,
  edit = false,
}: {
  role: UserRole;
  edit?: boolean;
}) {
  return (
    <Protected role={role}>
      {(user) => (
        <Workspace user={user} title="Termos de uso">
          <Link
            href={edit ? `${homeRoutes[role]}/terms` : homeRoutes[role]}
            className="inline-block text-sm text-(--blue)"
          >
            {edit ? "Voltar aos termos" : "Voltar ao início"}
          </Link>
          <TermsContent role={role} edit={edit} />
        </Workspace>
      )}
    </Protected>
  );
}

"use client";

import {
  ErrorMessage,
  actionClass,
  fieldClass,
} from "@/components/screens/Integration/shared";
import Input from "@/components/ui/Input";
import {
  legalApi,
  legalTypeList,
  legalTypes,
  type LegalDocType,
  type LegalDocument,
} from "@/integrations/legal/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useState, type FormEvent } from "react";

const legalKey = (type: LegalDocType) => ["legal-document", type];
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR") : null;

function DocumentBody({ doc, type }: { doc: LegalDocument; type: LegalDocType }) {
  const publishedAt = type === "terms" ? null : formatDate(doc.publishedAt);
  return (
    <>
      <div>
        <h2 className="wrap-break-word text-xl font-semibold">{doc.title}</h2>
        <p className="mt-2 text-sm text-(--muted)">
          Versão atual: {doc.version}
          {publishedAt ? ` · publicada em ${publishedAt}` : ""}
        </p>
      </div>
      <div className="whitespace-pre-wrap wrap-break-word border-t border-(--line) pt-5 text-sm leading-7">
        {doc.content}
      </div>
    </>
  );
}

/** Read-only view, used by non-admin roles (e.g. privacy policy). */
export function LegalDocumentView({ type }: { type: LegalDocType }) {
  const { label } = legalTypes[type];
  const doc = useQuery({
    queryKey: legalKey(type),
    queryFn: ({ signal }) => legalApi.current(type, signal),
  });
  if (doc.isPending) return <p role="status">Carregando {label.toLowerCase()}…</p>;
  if (doc.isError)
    return (
      <div className="space-y-4">
        <ErrorMessage error={doc.error} />
        <button className={actionClass} onClick={() => void doc.refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  return (
    <section className="space-y-5 rounded-2xl border border-(--line) bg-white p-5 sm:p-8">
      {doc.data ? (
        <DocumentBody doc={doc.data} type={type} />
      ) : (
        <p className="py-8 text-center text-sm text-(--muted)">
          {label} ainda não foi publicado.
        </p>
      )}
    </section>
  );
}

function Editor({
  type,
  current,
  onDone,
}: {
  type: LegalDocType;
  current: LegalDocument | null;
  onDone: () => void;
}) {
  const meta = legalTypes[type];
  const client = useQueryClient();
  const [title, setTitle] = useState(current?.title ?? meta.defaultTitle);
  const [content, setContent] = useState(current?.content ?? "");
  const [validation, setValidation] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (body: Pick<LegalDocument, "title" | "content">) =>
      legalApi.publish(type, body, !!current),
    onSuccess: async (published) => {
      client.setQueryData(legalKey(type), published);
      await Promise.all([
        type === "terms" && client.invalidateQueries({ queryKey: ["terms"] }),
        type === "terms" && client.invalidateQueries({ queryKey: ["terms-accepted"] }),
      ]);
      onDone();
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (save.isPending) return;
    if (!title.trim() || !content.trim()) {
      setValidation("Preencha o título e o conteúdo.");
      return;
    }
    setValidation(null);
    save.mutate({ title: title.trim(), content: content.trim() });
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">
          {current ? `Editar ${meta.label.toLowerCase()}` : `Criar ${meta.label.toLowerCase()}`}
        </h2>
        <p className="mt-2 text-sm text-(--muted)">
          Ao publicar, uma nova versão ficará disponível para {meta.audience}.
        </p>
      </div>
      <fieldset disabled={save.isPending} className="space-y-5">
        <Input
          id="legal-title"
          label="Título"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
        />
        <div>
          <label htmlFor="legal-content" className="block text-xs font-bold">
            Conteúdo
          </label>
          <textarea
            id="legal-content"
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
          {save.isPending ? "Publicando…" : current ? "Publicar nova versão" : "Publicar"}
        </button>
        {!save.isPending && (
          <button type="button" onClick={onDone} className="text-sm text-(--blue)">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}


/** Admin hub: pick the document type, read the current version, publish a new one. */
export function LegalDocumentsAdmin({ initialType = "terms" }: { initialType?: LegalDocType }) {
  const [type, setType] = useState<LegalDocType>(initialType);
  const [editing, setEditing] = useState(false);
  const meta = legalTypes[type];
  const doc = useQuery({
    queryKey: legalKey(type),
    queryFn: ({ signal }) => legalApi.current(type, signal),
  });
  return (
    <div className="space-y-6">
      <nav aria-label="Tipo de documento" className="flex gap-2 overflow-x-auto border-b border-(--line)">
        {legalTypeList.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={type === value}
            onClick={() => {
              setType(value);
              setEditing(false);
            }}
            className={`flex min-h-14 shrink-0 items-center gap-3 rounded-t-xl border-b-2 px-5 text-sm font-medium ${type === value ? "border-(--blue) bg-cyan-50 text-(--blue-dark)" : "border-transparent text-(--muted) hover:bg-white"}`}
          >
            <FileText size={20} aria-hidden="true" />
            {legalTypes[value].label}
          </button>
        ))}
      </nav>
      <section
        aria-label={meta.label}
        className="space-y-5 rounded-2xl border border-(--line) bg-white p-5 sm:p-8"
      >
        {doc.isPending && <p role="status">Carregando {meta.label.toLowerCase()}…</p>}
        {doc.isError && (
          <div className="space-y-4">
            <ErrorMessage error={doc.error} />
            <button className={actionClass} onClick={() => void doc.refetch()}>
              Tentar novamente
            </button>
          </div>
        )}
        {doc.isSuccess && editing && (
          <Editor key={type} type={type} current={doc.data} onDone={() => setEditing(false)} />
        )}
        {doc.isSuccess && !editing && (
          <>
            {doc.data ? (
              <>
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" className={actionClass} onClick={() => setEditing(true)}>
                    Editar
                  </button>
                </div>
                <DocumentBody doc={doc.data} type={type} />
              </>
            ) : (
              <div className="space-y-4 py-8 text-center">
                <h2 className="text-lg font-semibold">{meta.label} ainda não cadastrado.</h2>
                <button type="button" className={actionClass} onClick={() => setEditing(true)}>
                  Criar {meta.label.toLowerCase()}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

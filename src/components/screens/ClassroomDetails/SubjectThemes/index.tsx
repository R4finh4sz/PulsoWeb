"use client";

import {
  actionClass,
  ErrorMessage,
  fieldClass,
} from "@/components/screens/Integration/shared";
import { quizzesApi } from "@/integrations/quizzes/api";
import type { Subject } from "@/integrations/types";
import { ThemeNameSchema } from "@/validation/Theme.validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function SubjectThemes({
  subject,
  onClose,
}: {
  subject: Subject;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const errorId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const client = useQueryClient();
  const queryKey = ["quiz-themes", subject.classroomId, subject.id];
  const themes = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      quizzesApi.themes(subject.classroomId, subject.id, signal),
  });
  const create = useMutation({
    mutationFn: (value: string) =>
      quizzesApi.createTheme(subject.classroomId, subject.id, value),
    onSuccess: async () => {
      setName("");
      setError("");
      await client.invalidateQueries({ queryKey });
      input.current?.focus();
    },
  });
  const remove = useMutation({
    mutationFn: (theme: string) =>
      quizzesApi.removeTheme(subject.classroomId, subject.id, theme),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey });
    },
  });
  const busy = create.isPending || remove.isPending;
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function close() {
    if (busy) return;
    dialog.current?.close();
    onClose();
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),560px)] overflow-y-auto rounded-[20px] bg-white p-6 text-left shadow-2xl backdrop:bg-black/70 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-xl font-semibold">
            Temas de {subject.name}
          </h2>
          <p className="mt-2 text-sm text-(--muted)">
            Consulte e cadastre os temas desta matéria.
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          aria-label="Fechar temas"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-cyan-50 disabled:opacity-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          const parsed = ThemeNameSchema.safeParse(name);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            input.current?.focus();
            return;
          }
          setError("");
          remove.reset();
          create.mutate(parsed.data);
        }}
      >
        <label className="block text-sm font-medium">
          Novo tema
          <input
            ref={input}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
              create.reset();
            }}
            required
            minLength={1}
            maxLength={40}
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={fieldClass}
            placeholder="Nome do tema"
          />
        </label>
        <p className="text-xs text-(--muted)"></p>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <ErrorMessage error={create.error} />
        {create.isSuccess && (
          <p role="status" className="text-sm text-emerald-800">
            Tema cadastrado.
          </p>
        )}
        <button
          type="submit"
          className={`${actionClass} w-full`}
          disabled={busy}
        >
          {create.isPending ? "Cadastrando…" : "Cadastrar tema"}
        </button>
      </form>
      <section
        aria-label="Temas cadastrados"
        className="mt-6 border-t border-(--line) pt-5"
      >
        <h3 className="text-sm font-semibold">Temas cadastrados</h3>
        {themes.isPending && (
          <p role="status" className="mt-3 text-sm">
            Carregando temas…
          </p>
        )}
        <ErrorMessage error={themes.error} />
        {themes.isError && (
          <button
            type="button"
            onClick={() => themes.refetch()}
            className="min-h-11 text-sm underline"
          >
            Tentar novamente
          </button>
        )}
        {themes.isSuccess && !themes.data.length && (
          <p className="mt-3 text-sm text-(--muted)">
            Nenhum tema cadastrado nesta matéria.
          </p>
        )}
        <ErrorMessage error={remove.error} />
        {remove.isSuccess && (
          <p role="status" className="mt-2 text-sm text-emerald-800">
            Tema removido.
          </p>
        )}
        <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto">
          {themes.data?.map((theme) => (
            <li
              key={theme}
              className="flex items-center justify-between gap-3 rounded-lg border border-(--line) py-1 pl-4 pr-1 text-sm"
            >
              <span className="min-w-0 break-words">{theme}</span>
              <button
                type="button"
                aria-label={`Remover tema ${theme}`}
                title="Remover tema"
                disabled={busy}
                onClick={() => {
                  create.reset();
                  remove.mutate(theme);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-(--muted) hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </dialog>
  );
}

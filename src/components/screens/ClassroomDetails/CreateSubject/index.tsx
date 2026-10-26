"use client";

import {
  actionClass,
  ErrorMessage,
  fieldClass
} from "@/components/screens/Integration/shared";
import { useUnsavedQuiz } from "@/components/screens/SubjectQuizzes/useUnsavedQuiz";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { useClassroom } from "@/integrations/classrooms/hooks";
import { MAX_SUBJECTS, subjectsApi } from "@/integrations/subjects/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import {
  CreateSubjectSchema,
  MAX_SYLLABUS_TOPICS,
  type CreateSubject,
  type SubjectTopic,
} from "@/validation/Subject.validation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";

const emptyTopic = (): SubjectTopic => ({
  title: "",
  description: "",
  references: "",
});

function FieldError({
  field,
  errors,
}: {
  field: string;
  errors: Record<string, string>;
}) {
  return errors[field] ? (
    <p
      id={`${field}-error`}
      role="alert"
      className="mt-2 text-sm font-normal text-red-700"
    >
      {errors[field]}
    </p>
  ) : null;
}

export function SubjectForm({
  classroomId,
  canSave,
}: {
  classroomId: number;
  canSave: boolean;
}) {
  const router = useRouter();
  const room = useClassroom(classroomId);
  const subjects = useQuery({
    queryKey: ["subjects", classroomId],
    queryFn: ({ signal }) => subjectsApi.list(classroomId, signal),
  });
  const [name, setName] = useState("");
  const nextId = useRef(1);
  const [topics, setTopics] = useState(() => [{ id: 0, ...emptyTopic() }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const removeDialog = useRef<HTMLDialogElement>(null);
  const [topicToRemove, setTopicToRemove] = useState<number | null>(null);
  const mutation = useApiMutation((body: CreateSubject) =>
    subjectsApi.create(classroomId, body),
  );
  const dirty = !!(
    name ||
    topics.some((topic) => topic.title || topic.description || topic.references)
  );
  const { requestExit, confirmation } = useUnsavedQuiz(
    dirty && !mutation.isSuccess,
    mutation.isPending,
    "Sair da criação da disciplina?",
  );
  const back = `/teacher/classrooms/${classroomId}`;
  const limitReached = (subjects.data?.length ?? 0) >= MAX_SUBJECTS;
  const pending = mutation.isPending;

  useEffect(() => {
    if (topicToRemove !== null) removeDialog.current?.showModal();
    else removeDialog.current?.close();
  }, [topicToRemove]);

  function removeTopic(id: number) {
    if (pending || topics.length === 1) return;
    const remaining = topics.filter((topic) => topic.id !== id);
    setTopics(remaining);
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(
          ([field]) => !field.startsWith(`topic-${id}-`),
        ),
      ),
    );
    setTopicToRemove(null);
    requestAnimationFrame(() =>
      document.getElementById(`topic-${remaining[0].id}-title`)?.focus(),
    );
  }

  function clearError(field: string) {
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function updateTopic(id: number, field: keyof SubjectTopic, value: string) {
    setTopics((previous) =>
      previous.map((topic) =>
        topic.id === id ? { ...topic, [field]: value } : topic,
      ),
    );
    clearError(`topic-${id}-${field}`);
  }

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !canSave || limitReached || !subjects.isSuccess) return;
    const filledTopics = topics.filter(
      (topic) =>
        topic.title.trim() ||
        topic.description.trim() ||
        topic.references.trim(),
    );
    const parsed = CreateSubjectSchema.safeParse({
      name,
      syllabus: "",
      topics: filledTopics,
    });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const topic = filledTopics[Number(issue.path[1])] ?? topics[0];
        const field =
          issue.path[0] === "topics"
            ? `topic-${topic.id}-${String(issue.path[2] ?? "title")}`
            : "subject-name";
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      requestAnimationFrame(() =>
        document.getElementById(Object.keys(nextErrors)[0])?.focus(),
      );
      return;
    }
    setErrors({});
    try {
      const subject = await mutation.mutateAsync(parsed.data);
      router.push(`${back}/subjects/${subject.id}`);
    } catch {
      // Preserve all fields so the teacher can retry.
    }
  }

  if (room.isPending || subjects.isPending)
    return <p role="status">Carregando turma…</p>;
  if (room.error || subjects.error)
    return (
      <div className="space-y-4">
        <ErrorMessage error={room.error || subjects.error} />
        <button
          className={actionClass}
          onClick={() => {
            void room.refetch();
            void subjects.refetch();
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  if (!room.data) return <p role="alert">Turma não encontrada.</p>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <button
        type="button"
        disabled={pending}
        onClick={() => requestExit(() => router.push(back))}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-(--blue-dark) hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <ArrowLeft size={18} aria-hidden="true" /> Voltar
      </button>
      <header>
        <h1 className="page-title">Nova disciplina</h1>
        <p className="page-description mt-2 break-words">
          {room.data.name} · Organize a ementa e os temas das atividades.
        </p>
      </header>
      {!canSave && (
        <p
          role="status"
          className="rounded-xl border border-(--line) bg-white p-4 text-sm leading-6"
        >
          O cadastro com ementa está disponível no acesso de demonstração. O
          salvamento na sua escola estará disponível após a integração.
        </p>
      )}
      {limitReached && (
        <p role="alert" className="text-sm text-red-700">
          Esta turma já possui o limite de {MAX_SUBJECTS} disciplinas. Volte
          para consultar as disciplinas existentes.
        </p>
      )}
      <form
        onSubmit={submit}
        noValidate
        className="space-y-8 rounded-xl bg-(--surface) p-5 shadow-[0_8px_28px_rgba(22,62,75,0.10)] sm:p-8"
        aria-label="Criar disciplina"
      >
        <fieldset
          disabled={pending || limitReached}
          className="min-w-0 space-y-6"
        >
          <legend className="sr-only">Dados da disciplina</legend>
          <div>
            <label className="block text-sm font-medium" htmlFor="subject-name">
              Nome da disciplina{" "}
              <span className="font-normal text-(--muted)">(obrigatório)</span>
              <input
                id="subject-name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearError("subject-name");
                }}
                required
                maxLength={100}
                aria-invalid={!!errors["subject-name"]}
                aria-describedby={
                  errors["subject-name"] ? "subject-name-error" : undefined
                }
                className={`${fieldClass} aria-invalid:border-red-600`}
                placeholder="Ex.: Matemática"
              />
            </label>
            <FieldError field="subject-name" errors={errors} />
          </div>
        </fieldset>
        <section aria-labelledby="topics-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="topics-title" className="text-xl font-semibold">
              Ementa
            </h2>
            <p
              role="status"
              aria-live="polite"
              className="text-sm tabular-nums text-(--muted)"
            >
              {topics.length} de {MAX_SYLLABUS_TOPICS} tópicos
            </p>
          </div>
          <p
            id="topics-help"
            className="mt-2 max-w-prose text-sm leading-6 text-(--muted)"
          >
            Preencha ao menos um tópico com título e descrição. Os títulos serão
            os temas dos quizzes. Espaços totalmente vazios não serão salvos.
          </p>
          <div className="mt-6 divide-y divide-(--line)">
            {topics.map((topic, index) => (
              <fieldset
                key={topic.id}
                disabled={pending || limitReached}
                aria-describedby="topics-help"
                className="min-w-0 space-y-4 py-6 first:pt-0"
              >
                <legend className="sr-only">{index + 1}º tópico</legend>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{index + 1}º tópico</h3>
                  <button
                    type="button"
                    disabled={topics.length === 1}
                    aria-label={`Remover tópico ${index + 1}`}
                    onClick={() => {
                      if (topic.title || topic.description || topic.references)
                        setTopicToRemove(topic.id);
                      else removeTopic(topic.id);
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-(--muted) hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 disabled:opacity-50"
                  >
                    <Trash2 size={16} aria-hidden="true" /> Remover
                  </button>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`topic-${topic.id}-title`}
                  >
                    Título
                    <input
                      id={`topic-${topic.id}-title`}
                      aria-invalid={!!errors[`topic-${topic.id}-title`]}
                      aria-describedby={`topic-${topic.id}-hint${errors[`topic-${topic.id}-title`] ? ` topic-${topic.id}-title-error` : ""}`}
                      value={topic.title}
                      onChange={(event) =>
                        updateTopic(topic.id, "title", event.target.value)
                      }
                      maxLength={40}
                      className={`${fieldClass} aria-invalid:border-red-600`}
                      placeholder="Ex.: Frações e suas representações"
                    />
                  </label>
                  <FieldError
                    field={`topic-${topic.id}-title`}
                    errors={errors}
                  />
                  <p
                    id={`topic-${topic.id}-hint`}
                    className="mt-1 text-xs text-(--muted)"
                  >
                    Até 40 caracteres. Este será o nome do tema.
                  </p>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`topic-${topic.id}-description`}
                  >
                    Descrição
                    <textarea
                      id={`topic-${topic.id}-description`}
                      aria-invalid={!!errors[`topic-${topic.id}-description`]}
                      aria-describedby={
                        errors[`topic-${topic.id}-description`]
                          ? `topic-${topic.id}-description-error`
                          : undefined
                      }
                      value={topic.description}
                      onChange={(event) =>
                        updateTopic(topic.id, "description", event.target.value)
                      }
                      maxLength={2000}
                      rows={3}
                      className={`${fieldClass} resize-y aria-invalid:border-red-600`}
                      placeholder="Descreva os conteúdos e objetivos deste tópico."
                    />
                  </label>
                  <FieldError
                    field={`topic-${topic.id}-description`}
                    errors={errors}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`topic-${topic.id}-references`}
                  >
                    Referências bibliográficas{" "}
                    <span className="font-normal text-(--muted)">
                      (opcional)
                    </span>
                    <textarea
                      id={`topic-${topic.id}-references`}
                      aria-invalid={!!errors[`topic-${topic.id}-references`]}
                      aria-describedby={
                        errors[`topic-${topic.id}-references`]
                          ? `topic-${topic.id}-references-error`
                          : undefined
                      }
                      value={topic.references}
                      onChange={(event) =>
                        updateTopic(topic.id, "references", event.target.value)
                      }
                      maxLength={4000}
                      rows={2}
                      className={`${fieldClass} resize-y aria-invalid:border-red-600`}
                      placeholder="Autor, título, edição, ano ou link. Uma referência por linha."
                    />
                  </label>
                  <FieldError
                    field={`topic-${topic.id}-references`}
                    errors={errors}
                  />
                </div>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            disabled={
              pending || limitReached || topics.length >= MAX_SYLLABUS_TOPICS
            }
            onClick={() => {
              const id = nextId.current++;
              setTopics((previous) => [...previous, { id, ...emptyTopic() }]);
              requestAnimationFrame(() =>
                document.getElementById(`topic-${id}-title`)?.focus(),
              );
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-(--line) px-4 py-2 text-sm font-medium text-(--blue-dark) hover:bg-cyan-50 focus-visible:outline-2 disabled:opacity-50"
          >
            <Plus size={18} aria-hidden="true" /> Adicionar tópico
          </button>
          {topics.length === MAX_SYLLABUS_TOPICS && (
            <p role="status" className="mt-3 text-sm text-(--muted)">
              Limite de 15 tópicos atingido.
            </p>
          )}
        </section>
        <ErrorMessage error={mutation.error} />
        <div className="flex flex-col-reverse gap-3  sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => requestExit(() => router.push(back))}
            className="min-h-12 rounded-xl border border-(--line) px-5 text-sm font-medium hover:bg-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || limitReached || !canSave}
            className={`${actionClass} min-h-12`}
          >
            {pending ? "Salvando disciplina…" : "Criar disciplina"}
          </button>
        </div>
      </form>
      {confirmation}
      <dialog
        ref={removeDialog}
        aria-labelledby="remove-topic-title"
        onCancel={(event) => {
          event.preventDefault();
          setTopicToRemove(null);
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-transparent p-0 backdrop:bg-black/70"
      >
        <FeedbackModalContent
          type="error"
          titleId="remove-topic-title"
          title="Remover tópico?"
          message="O título, a descrição e as referências deste tópico serão descartados."
          actionLabel="Cancelar"
          autoFocusAction
          onClose={() => setTopicToRemove(null)}
          secondaryAction={{
            label: "Remover tópico",
            destructive: true,
            onClick: () => {
              if (topicToRemove !== null) removeTopic(topicToRemove);
            },
          }}
        />
      </dialog>
    </div>
  );
}

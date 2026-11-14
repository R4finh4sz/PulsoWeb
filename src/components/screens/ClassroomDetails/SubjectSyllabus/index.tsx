"use client";

import type { Subject } from "@/integrations/types";
import { BookOpenText, ChevronDown, FileText, LibraryBig } from "lucide-react";
import { useId, useState } from "react";

export function SubjectSyllabus({
  subject,
  defaultExpanded = false,
}: {
  subject: Subject;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();
  if (!subject.topics?.length) return null;
  return (
    <section className="rounded-2xl border border-(--line) bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((value) => !value)}
          className="flex min-h-20 w-full items-center gap-4 rounded-2xl px-5 py-5 text-left text-(--ink) hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus) sm:px-6"
        >
          <FileText
            size={24}
            strokeWidth={1.7}
            aria-hidden="true"
            className="shrink-0 text-(--blue-dark)"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">
              Ementa da disciplina
            </span>
            <span className="mt-1 block text-sm font-normal text-(--muted)">
              Conteúdo programático e referências da matéria
            </span>
          </span>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={`shrink-0 text-(--blue-dark) ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div
        id={contentId}
        hidden={!expanded}
        className={`${expanded ? "block" : "hidden"} border-t border-(--line) px-5 py-6 sm:p-6`}
      >
        {!!subject.topics?.length && (
          <section className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BookOpenText
                  size={18}
                  aria-hidden="true"
                  className="text-(--blue-dark)"
                />
                Conteúdo programático
              </h3>
              <span className="text-xs text-(--muted)">
                {subject.topics.length}{" "}
                {subject.topics.length === 1 ? "tópico" : "tópicos"}
              </span>
            </div>
            <ol className="mt-5 divide-y divide-(--line)">
              {subject.topics?.map((topic, index) => (
                <li
                  key={topic.title}
                  className="space-y-2 py-5 first:pt-0 last:pb-0"
                >
                  <h4 className="text-base font-semibold [overflow-wrap:anywhere]">
                    {index + 1}. {topic.title}
                  </h4>
                  <p className="max-w-prose whitespace-pre-wrap text-sm leading-7 text-(--muted) [overflow-wrap:anywhere]">
                    {topic.description}
                  </p>
                  {topic.references && (
                    <div className="pt-2">
                      <p className="flex items-center gap-2 text-xs font-medium text-(--ink)">
                        <LibraryBig
                          size={15}
                          aria-hidden="true"
                          className="shrink-0 text-(--blue-dark)"
                        />
                        Referências bibliográficas
                      </p>
                      <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-7 text-(--muted) [overflow-wrap:anywhere]">
                        {topic.references}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </section>
  );
}

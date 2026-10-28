import type { Subject } from "@/integrations/types";

export function SubjectSyllabus({ subject }: { subject: Subject; }) {
  if (!subject.syllabus && !subject.topics?.length) return null;
  return (
    <details className="rounded-xl border border-(--line) bg-white p-5 sm:p-6">
      <summary className="min-h-11 cursor-pointer text-lg font-semibold text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-4">
        Ementa da disciplina
      </summary>
      <div className="mt-4 space-y-6">
        {subject.syllabus && (
          <p className="max-w-prose whitespace-pre-wrap break-words text-sm leading-7">
            {subject.syllabus}
          </p>
        )}
        <ol className="divide-y divide-(--line)">
          {subject.topics?.map((topic, index) => (
            <li
              key={topic.title}
              className="space-y-2 py-5 first:pt-0 last:pb-0"
            >
              <h3 className="break-words font-semibold">
                {index + 1}. {topic.title}
              </h3>
              <p className="max-w-prose whitespace-pre-wrap break-words text-sm leading-7 text-(--muted)">
                {topic.description}
              </p>
              {topic.references && (
                <div className="pt-2">
                  <h4 className="text-sm font-medium">
                    Referências bibliográficas
                  </h4>
                  <p className="mt-1 max-w-prose whitespace-pre-wrap break-words text-sm leading-7 text-(--muted)">
                    {topic.references}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}

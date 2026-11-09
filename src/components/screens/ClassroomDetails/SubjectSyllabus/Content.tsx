"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Pencil } from "lucide-react";
import { SubjectForm } from "@/components/screens/ClassroomDetails/CreateSubject";
import {
  ErrorMessage,
  actionClass,
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import { subjectsApi } from "@/integrations/subjects/api";
import { canAccessSubject } from "@/utils/subjectAccess";
import { SubjectSyllabus } from ".";

export function SyllabusContent({
  classroomId,
  subjectId,
  teacherId,
}: {
  classroomId: number;
  subjectId: number;
  teacherId: number;
}) {
  const [editing, setEditing] = useState(false);
  const query = useQuery({
    queryKey: ["subjects", classroomId],
    queryFn: ({ signal }) => subjectsApi.list(classroomId, signal),
  });
  if (query.isPending) return <p role="status">Carregando ementa…</p>;
  if (query.isError)
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorMessage error={query.error} />
        <button className={actionClass} onClick={() => void query.refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  const subject = query.data.find((item) => item.id === subjectId);
  if (!subject || !canAccessSubject(subject, teacherId))
    return (
      <p role="alert">Ementa não encontrada ou não vinculada ao seu perfil.</p>
    );
  if (editing)
    return (
      <SubjectForm
        classroomId={classroomId}
        existing={subject}
        canSave
        onSaved={() => setEditing(false)}
      />
    );
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <BackLink />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title flex items-center gap-3 [overflow-wrap:anywhere]">
            <FileText
              size={28}
              className="shrink-0 text-(--blue-dark)"
              aria-hidden="true"
            />
            {subject.name}
          </h1>
          <p className="page-description mt-3">
            Consulte os tópicos e as referências da ementa.
          </p>
        </div>
        <button
          className={`${actionClass} gap-2`}
          onClick={() => setEditing(true)}
        >
          <Pencil size={18} aria-hidden="true" />
          Editar ementa
        </button>
      </header>
      {subject.topics?.length ? (
        <SubjectSyllabus subject={subject} defaultExpanded />
      ) : (
        <p className="rounded-xl border border-(--line) bg-white p-6 text-sm text-(--muted)">
          Nenhum tópico cadastrado nesta ementa.
        </p>
      )}
    </div>
  );
}

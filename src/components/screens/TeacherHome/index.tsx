"use client";

import {
  ErrorMessage
} from "@/components/screens/Integration/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClassrooms } from "@/integrations/classrooms/hooks";
import { useSchools } from "@/integrations/schools/hooks";
import { MapPin, School, Users } from "lucide-react";
import Link from "next/link";

export function SchoolChoices() {
  const schools = useSchools();
  const classrooms = useClassrooms(true, true);
  const linked = schools.data;
  return (
    <>
      <div className="mb-10">
        <h1 className="page-title max-w-[30ch]">
          Em qual escola você deseja acessar?
        </h1>
        <p className="page-description mt-4">
          {schools.isPending
            ? "Carregando suas escolas…"
            : linked?.length
              ? `Você está vinculado a ${linked.length} ${linked.length === 1 ? "escola" : "escolas"}. Selecione uma para continuar.`
              : "Suas escolas vinculadas aparecerão aqui."}
        </p>
      </div>
      <ErrorMessage error={schools.error} />
      {schools.isError && (
        <button
          onClick={() => schools.refetch()}
          className="mt-4 text-sm font-medium text-cyan-800 underline"
        >
          Tentar novamente
        </button>
      )}
      {schools.isPending && (
        <p role="status" className="text-sm text-slate-500">
          Carregando escolas…
        </p>
      )}
      {schools.isSuccess && !linked?.length && (
        <EmptyState
          icon={School}
          title="Nenhuma escola vinculada ao seu perfil."
        />
      )}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {linked?.map((school) => {
          const count = classrooms.data?.filter(
            (room) => room.schoolId === school.id,
          ).length;
          return (
            <Link
              key={school.id}
              href={`/teacher/schools/${school.id}`}
              className="choice-card group text-left"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7fa] text-[#0789a5] transition group-hover:bg-[#d9f1f6]">
                <School aria-hidden="true" size={29} strokeWidth={1.7} />
              </div>
              <h2 className="text-lg font-semibold leading-7 tracking-tight text-[var(--ink)]">
                {school.nome}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin
                  size={15}
                  className="text-[#087e9b]"
                  aria-hidden="true"
                />
                {[school.cidade, school.uf].filter(Boolean).join(", ") ||
                  "Localização não informada"}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#e8f7fa] px-3 py-2 text-sm font-medium text-[#087e9b]">
                <Users size={17} aria-hidden="true" />
                {classrooms.isSuccess && count !== undefined
                  ? `${count} ${count === 1 ? "turma" : "turmas"}`
                  : "Minhas turmas"}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "@/components/ui/DashboardIcon";
import type { Classroom } from "@/interfaces/classroom";

export function ClassroomCard({ room }: { room: Classroom }) {
  const pathname = usePathname();
  const base = pathname.startsWith("/professor") ? "/professor" : "/coordenador";
  return (
    <Link href={`${base}/turmas/${encodeURIComponent(room.id)}`} aria-label={`Abrir turma ${room.name}`} className="group block w-full rounded-xl border border-[var(--line)] bg-white p-4 text-left transition hover:border-[var(--blue)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue)]">
      <span className="flex items-center gap-3">
        <span className={`rounded-xl p-3 ${room.color === "yellow" ? "bg-[#fff6d5] text-[#866b00]" : "bg-[#e8f5f8] text-[var(--blue)]"}`}><DashboardIcon name="book" /></span>
        <span className="flex-1"><span className="block font-semibold">{room.name}</span><span className="mt-1 block text-xs text-[var(--muted)]">Ensino médio · {room.period}</span></span>
        <DashboardIcon name="arrow" className="h-4 w-4 text-[var(--blue)] transition-transform group-hover:translate-x-1" />
      </span>
      <span className="mt-4 flex justify-between gap-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
        <span>{room.students} alunos vinculados</span>
        <span>{room.teacherIds.length} {room.teacherIds.length === 1 ? "professor" : "professores"}</span>
      </span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useClassroomStore } from "@/store/classroomStore";
import { getClassroomsForUser } from "@/services/dashboard";
import { DashboardShell } from "@/components/screens/Dashboard/DashboardShell";
import { ClassroomCard } from "@/components/screens/Dashboard/ClassroomCard";
import { DashboardPanel } from "@/components/ui/DashboardPanel";

export function Classrooms() {
  const user = useSession("coordenador");
  const allRooms = useClassroomStore((state) => state.rooms);
  if (!user) return <p role="status" className="p-8 text-sm">Carregando suas turmas…</p>;
  const rooms = getClassroomsForUser(user, allRooms);

  return (
    <DashboardShell
      user={user}
      title="Turmas"
      description="Consulte as turmas da sua escola e adicione novas turmas com seus professores."
      navigation={[
        { label: "Turmas", href: "/coordenador/turmas", icon: "book" },
        { label: "Alunos", href: "/coordenador#students", icon: "users" },
        { label: "Professores", href: "/coordenador#teachers", icon: "school" },
      ]}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted)]">{rooms.length} {rooms.length === 1 ? "turma cadastrada" : "turmas cadastradas"}</p>
        <Link href="/coordenador/turmas/nova" className="inline-flex items-center gap-2 rounded-lg bg-[var(--blue)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]">
          <Plus aria-hidden="true" className="h-4 w-4" />Adicionar turma
        </Link>
      </div>
      <DashboardPanel id="classrooms" title="Todas as turmas" description="Clique em uma turma para consultar seus detalhes.">
        {rooms.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => <ClassroomCard key={room.id} room={room} />)}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-6 text-sm text-[var(--muted)]">Nenhuma turma cadastrada. Use “Adicionar turma” para começar.</p>
        )}
      </DashboardPanel>
    </DashboardShell>
  );
}

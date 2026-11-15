"use client";

import { actionClass, ErrorMessage } from "@/components/screens/Integration/shared";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import { schoolsApi } from "@/integrations/schools/api";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useUsers } from "@/integrations/users/hooks";
import { getInitials } from "@/utils/text";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SchoolManagement({ schoolId }: { schoolId: number }) {
  const client = useQueryClient();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [userId, setUserId] = useState("");
  const users = useUsers("coordinators", { q: search, page, size: 10 });
  const assign = useApiMutation(async (id: number) => {
    await schoolsApi.assignCoordinator(schoolId, id);
    await client.invalidateQueries({ queryKey: ["schools"] });
    setUserId("");
  });
  const deactivate = useApiMutation(async () => {
    await schoolsApi.deactivate(schoolId);
    await client.invalidateQueries({ queryKey: ["schools"] });
    router.replace("/admin/schools");
  });
  const busy = assign.isPending || deactivate.isPending;

  return (
    <>
      <DashboardPanel id="school-users" title="Trocar coordenador da escola">
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!busy && users.data?.content.some((user) => String(user.id) === userId))
            assign.mutate(Number(userId));
        }}>
          <p className="text-sm text-(--muted)">Escolha um coordenador existente para substituir o atual. Ele não pode ter vínculo com outra escola ativa e a conta do coordenador anterior será preservada.</p>
          <div className="overflow-hidden rounded-xl border border-(--line) bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-(--line) p-3">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-(--line) bg-[var(--paper)] px-3 py-2 focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20">
                <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-(--muted)" />
                <input type="search" aria-label="Buscar coordenador por nome ou matrícula" placeholder="Buscar coordenador por nome ou matrícula" className="min-w-0 w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-(--muted)" value={search} maxLength={150} disabled={busy} onChange={(event) => {
                  setSearch(event.target.value); setPage(0); setUserId("");
                }} />
              </label>
              <span role="status" className="text-xs font-medium text-(--muted)">
                {users.data ? `${users.data.totalElements} ${users.data.totalElements === 1 ? "coordenador" : "coordenadores"}` : "-- coordenadores"}
              </span>
            </div>
            {users.isPending && <p role="status" className="p-4 text-sm text-(--muted)">Carregando coordenadores…</p>}
            {users.isError && <div className="space-y-3 p-3"><ErrorMessage error={users.error} /><button type="button" className={actionClass} onClick={() => users.refetch()}>Tentar novamente</button></div>}
            {users.isSuccess && !users.data.content.length && <p role="status" className="p-4 text-sm text-(--muted)">Nenhum coordenador encontrado.</p>}
            <ul role="radiogroup" aria-label="Coordenadores disponíveis" className="divide-y divide-(--line)">
              {users.data?.content.map((user) => {
                const selected = String(user.id) === userId;
                return (
                  <li key={user.id}>
                    <label className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--paper)] ${selected ? "bg-[#e1f5f8]" : ""}`}>
                      <input type="radio" name="coordinator" className="sr-only" checked={selected} disabled={busy} onChange={() => setUserId(String(user.id))} />
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1f5f8] text-xs font-semibold text-(--blue)">
                        {selected ? <Check className="h-4 w-4" /> : getInitials(user.fullName).toLocaleUpperCase("pt-BR")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-(--ink)">{user.fullName}</span>
                        <span className="block break-all text-xs text-(--muted)">{user.email} · Matrícula: {user.ra || "Não informado"}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {users.data && users.data.totalPages > 1 && <nav aria-label="Paginação de coordenadores" className="flex items-center justify-end gap-3 border-t border-(--line) p-3">
              <button type="button" aria-label="Página anterior" disabled={busy || users.isFetching || page === 0} onClick={() => { setPage(page - 1); setUserId(""); }} className="rounded-lg border border-(--line) p-3 disabled:opacity-40"><ArrowLeft size={18} /></button>
              <span className="text-xs tabular-nums text-(--muted)" aria-live="polite">Página {page + 1} de {users.data.totalPages}</span>
              <button type="button" aria-label="Próxima página" disabled={busy || users.isFetching || page + 1 >= users.data.totalPages} onClick={() => { setPage(page + 1); setUserId(""); }} className="rounded-lg border border-(--line) p-3 disabled:opacity-40"><ArrowRight size={18} /></button>
            </nav>}
          </div>
          <button className={actionClass} disabled={busy || !userId || users.isFetching || users.isError}>{assign.isPending ? "Trocando…" : "Trocar coordenador"}</button>
        </form>
      </DashboardPanel>
      <DashboardPanel id="school-deactivation" title="Desativar escola">
        <p className="mb-4 text-sm leading-6">A escola deixará de aparecer nas listagens e não aceitará novos vínculos nem operações nas turmas. Contas, notas e histórico serão preservados.</p>
        {confirm ? <div className="space-y-4">
          <p className="text-sm font-medium">Confirmar a desativação desta escola?</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={actionClass} disabled={busy} onClick={() => setConfirm(false)}>Cancelar</button>
            <button type="button" className="min-h-11 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50" disabled={busy} onClick={() => deactivate.mutate()}>{deactivate.isPending ? "Desativando…" : "Confirmar desativação"}</button>
          </div>
        </div> : <button type="button" className="min-h-11 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-50" disabled={busy} onClick={() => setConfirm(true)}>Desativar escola</button>}
      </DashboardPanel>
    </>
  );
}

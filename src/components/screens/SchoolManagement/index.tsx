"use client";

import { actionClass, ErrorMessage, fieldClass } from "@/components/screens/Integration/shared";
import { DashboardPanel } from "@/components/ui/DashboardPanel";
import { schoolsApi } from "@/integrations/schools/api";
import type { UserResource } from "@/integrations/types";
import { useApiMutation } from "@/integrations/useApiMutation";
import { useUsers } from "@/integrations/users/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SchoolManagement({ schoolId }: { schoolId: number }) {
  const client = useQueryClient();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [resource, setResource] = useState<UserResource>("students");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [userId, setUserId] = useState("");
  const users = useUsers(resource, { q: search, page, size: 10 });
  const assign = useApiMutation(async (id: number) => {
    if (resource === "coordinators") await schoolsApi.assignCoordinator(schoolId, id);
    else await schoolsApi.assignUser(schoolId, id);
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
      <DashboardPanel id="school-users" title="Vincular usuário à escola">
        <form className="max-w-xl space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!busy && users.data?.content.some((user) => String(user.id) === userId))
            assign.mutate(Number(userId));
        }}>
          <p className="text-sm text-(--muted)">Vincule uma conta existente a esta escola ativa. O cadastro e o histórico serão preservados.</p>
          {resource === "coordinators" && <p className="text-sm text-(--muted)">O coordenador selecionado não pode ter vínculo com outra escola ativa. Ele substituirá o coordenador atual, cuja conta será preservada.</p>}
          {resource === "students" && <p className="text-sm text-(--muted)">Use este vínculo para alunos sem escola ativa. O aluno ficará sem turma até a matrícula pela coordenação. Se já pertencer a outra escola ativa, solicite a transferência pela escola de origem.</p>}
          <label className="block text-sm">Tipo de usuário
            <select className={fieldClass} value={resource} disabled={busy} onChange={(event) => {
              setResource(event.target.value as UserResource);
              setPage(0); setUserId("");
            }}>
              <option value="students">Aluno</option>
              <option value="teachers">Professor</option>
              <option value="coordinators">Coordenador</option>
            </select>
          </label>
          <label className="block text-sm">Buscar usuário
            <input type="search" className={fieldClass} value={search} maxLength={150} disabled={busy} onChange={(event) => {
              setSearch(event.target.value); setPage(0); setUserId("");
            }} />
          </label>
          <ErrorMessage error={users.error} />
          {users.isError && <button type="button" className={actionClass} onClick={() => users.refetch()}>Tentar novamente</button>}
          <label className="block text-sm">Usuário
            <select required className={fieldClass} value={userId} disabled={busy || users.isFetching || users.isError} onChange={(event) => setUserId(event.target.value)}>
              <option value="">{users.isPending ? "Carregando usuários…" : "Selecione o usuário"}</option>
              {users.data?.content.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}
            </select>
          </label>
          {users.isSuccess && !users.data.content.length && <p role="status" className="text-sm text-(--muted)">Nenhum usuário encontrado.</p>}
          {users.data && users.data.totalPages > 1 && <nav aria-label="Paginação de usuários" className="flex items-center gap-4 text-sm">
            <button type="button" disabled={busy || users.isFetching || page === 0} onClick={() => { setPage(page - 1); setUserId(""); }} className={actionClass}>Anterior</button>
            <span>Página {page + 1} de {users.data.totalPages}</span>
            <button type="button" disabled={busy || users.isFetching || page + 1 >= users.data.totalPages} onClick={() => { setPage(page + 1); setUserId(""); }} className={actionClass}>Próxima</button>
          </nav>}
          <button className={actionClass} disabled={busy || !userId || users.isFetching || users.isError}>{assign.isPending ? "Vinculando…" : "Vincular à escola"}</button>
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

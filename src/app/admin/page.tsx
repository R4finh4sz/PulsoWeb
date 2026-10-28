"use client";

import { ActivityRow, Metric, panelClass } from "@/components/screens/AdminDashboard";
import {
  ErrorMessage,
  Protected,
  Workspace,
} from "@/components/screens/Integration/shared";
import { useSchools } from "@/integrations/schools/hooks";
import { useUsers } from "@/integrations/users/hooks";
import Link from "next/link";

export default function AdminHome() {
  const schools = useSchools();
  const coordinators = useUsers("coordinators", { page: 0, size: 1 });
  const loading = schools.isPending || coordinators.isPending;

  return (
    <Protected role="admin">
      {(user) => (
        <Workspace user={user} title="Visão geral">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-(--muted)">
                Acompanhe o movimento da sua rede escolar.
              </p>
              <p className="mt-1 text-xs text-(--muted)">
                Última atualização: agora
              </p>
            </div>
          </div>
          <ErrorMessage error={schools.error || coordinators.error} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Escolas cadastradas"
              value={schools.data?.length ?? "--"}
              detail="Instituições na sua rede"
              icon="school"
              tone="bg-[#e1f5f8] text-[#008da8]"
            />
            <Metric
              label="Coordenadores"
              value={coordinators.data?.totalElements ?? "--"}
              detail="Lideranças cadastradas"
              icon="users"
              tone="bg-[#ddf8e8] text-[#18a957]"
            />
            <Metric
              label="Alertas do sistema"
              value="0"
              detail="Nenhuma pendência crítica"
              icon="chart"
              tone="bg-[#fff2c9] text-[#d99700]"
            />
            <Metric
              label="Disponibilidade"
              value={loading ? "--" : "100%"}
              detail="Serviços operacionais"
              icon="check"
              tone="bg-[#e1f5f8] text-[#008da8]"
            />
          </div>
          <div>
            <section className={panelClass}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Atividade recente</h2>
                <Link
                  href="/admin/schools"
                  className="text-xs font-medium text-(--blue)"
                >
                  Ver escolas
                </Link>
              </div>
              <ul>
                <ActivityRow
                  icon="school"
                  tone="bg-[#e1f5f8] text-[#008da8]"
                  title="Painel administrativo consultado"
                  detail="Acompanhe escolas e coordenadores da rede"
                  status="Ativo"
                />
                <ActivityRow
                  icon="users"
                  tone="bg-[#ddf8e8] text-[#18a957]"
                  title="Gestão de coordenadores disponível"
                  detail="Consulte ou cadastre novas lideranças"
                  status="Pronto"
                />
                <ActivityRow
                  icon="check"
                  tone="bg-[#fff2c9] text-[#d99700]"
                  title="Nenhuma pendência encontrada"
                  detail="A plataforma está em dia"
                  status="Estável"
                />
              </ul>
            </section>
          </div>
        </Workspace>
      )}
    </Protected>
  );
}


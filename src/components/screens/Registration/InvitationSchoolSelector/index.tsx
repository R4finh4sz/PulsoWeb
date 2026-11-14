"use client";

import {
  ErrorMessage,
  actionClass,
  fieldClass,
} from "@/components/screens/Integration/shared";
import Input from "@/components/ui/Input";
import { schoolsApi } from "@/integrations/schools/api";
import { formatCep, normalizeCep } from "@/utils/viacep";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function InvitationSchoolSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [cep, setCep] = useState("");
  const [page, setPage] = useState(0);
  const digits = normalizeCep(cep);
  const validCep = digits.length === 8;
  const schools = useQuery({
    queryKey: ["invitation-schools", digits, page],
    queryFn: ({ signal }) => schoolsApi.searchByCep(digits, page, signal),
    enabled: validCep,
  });

  return (
    <div className="space-y-4">
      <Input
        id="school-cep"
        label="CEP da escola"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        maxLength={9}
        value={cep}
        aria-describedby="school-cep-help"
        onChange={(event) => {
          setCep(formatCep(event.target.value));
          setPage(0);
          onChange("");
        }}
      />
      <p id="school-cep-help" className="text-xs text-(--muted)">
        Informe os 8 dígitos do CEP para buscar as escolas cadastradas nesse
        endereço.
      </p>
      {validCep && schools.isPending && (
        <p role="status" className="text-sm text-(--muted)">
          Buscando escolas…
        </p>
      )}
      {validCep && <ErrorMessage error={schools.error} />}
      {validCep && schools.isError && (
        <button
          type="button"
          className={actionClass}
          onClick={() => void schools.refetch()}
        >
          Tentar novamente
        </button>
      )}
      {validCep &&
        schools.isSuccess &&
        (schools.data.content.length === 0 ? (
          <p role="status" className="text-sm text-(--muted)">
            Nenhuma escola cadastrada para este CEP.
          </p>
        ) : (
          <>
            <label
              htmlFor="invitation-school"
              className="block text-sm font-medium"
            >
              Escola
              <select
                id="invitation-school"
                name="schoolId"
                className={fieldClass}
                value={value}
                required
                onChange={(event) => onChange(event.target.value)}
              >
                <option value="">Selecione a escola</option>
                {schools.data.content.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} · {school.city}/{school.state}
                  </option>
                ))}
              </select>
            </label>
            {schools.data.totalPages > 1 && (
              <nav
                aria-label="Páginas de escolas"
                className="flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <button
                  type="button"
                  disabled={page === 0}
                  className="min-h-11 text-(--blue-dark) disabled:opacity-50"
                  onClick={() => {
                    setPage(page - 1);
                    onChange("");
                  }}
                >
                  Anterior
                </button>
                <span>
                  Página {page + 1} de {schools.data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= schools.data.totalPages}
                  className="min-h-11 text-(--blue-dark) disabled:opacity-50"
                  onClick={() => {
                    setPage(page + 1);
                    onChange("");
                  }}
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        ))}
    </div>
  );
}

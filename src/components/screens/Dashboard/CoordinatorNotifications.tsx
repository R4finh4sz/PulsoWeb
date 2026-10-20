"use client";

import { registrationApi } from "@/integrations/registration/api";
import { accountDeletionsApi } from "@/integrations/profile/deletions";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export function CoordinatorNotifications({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const query = useQuery({
    queryKey: ["registration-requests", "PENDING", 0],
    queryFn: ({ signal }) => registrationApi.list("PENDING", 0, signal),
    refetchInterval: 30000,
  });
  const deletions = useQuery({
    queryKey: ["account-deletion-requests", "PENDING"],
    queryFn: ({ signal }) => accountDeletionsApi.list("PENDING", signal),
    refetchInterval: 30000,
  });
  const pending = [
    ...(deletions.data ?? []).map((request) => ({
      ...request,
      deletion: true,
    })),
    ...(query.data?.content ?? []).map((request) => ({
      ...request,
      deletion: false,
    })),
  ];
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`Notificações${pending.length ? (deletions.data?.length ? ", há solicitações aguardando análise" : ", há cadastros aguardando análise") : ""}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${dark ? "text-[#d8e9ee] hover:bg-[#245362] focus-visible:outline-white" : "text-slate-600 hover:bg-cyan-50"}`}
      >
        <Bell size={21} aria-hidden="true" />
        {pending.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"
          />
        )}
      </button>
      {open && (
        <section
          id={id}
          aria-label="Notificações do coordenador"
          className="absolute right-0 top-full z-30 mt-3 max-h-[70dvh] w-[min(360px,calc(100vw-40px))] overflow-y-auto rounded-2xl border border-(--line) bg-white shadow-xl max-sm:fixed max-sm:left-5 max-sm:right-5 max-sm:top-20 max-sm:w-auto"
        >
          <div className="flex items-center justify-between border-b border-(--line) px-5 py-3">
            <h2 className="font-semibold">Notificações</h2>
            <button
              type="button"
              aria-label="Fechar notificações"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-50"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {query.isPending || deletions.isPending ? (
            <p role="status" className="p-5 text-sm text-(--muted)">
              Carregando notificações…
            </p>
          ) : query.isError || deletions.isError ? (
            <div className="space-y-3 p-5">
              <p role="alert" className="text-sm text-red-700">
                Não foi possível carregar as notificações.
              </p>
              <button
                type="button"
                onClick={() => {
                  query.refetch();
                  deletions.refetch();
                }}
                className="text-sm font-medium text-(--blue-dark) underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : !pending.length ? (
            <div className="p-5">
              <p className="text-sm font-medium">Tudo em dia por aqui</p>
              <p className="mt-2 text-sm text-(--muted)">
                Nenhuma solicitação aguardando análise.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-(--line)">
                {pending.slice(0, 3).map((request) => (
                  <li
                    key={`${request.deletion ? "deletion" : "registration"}:${request.id}`}
                  >
                    <Link
                      href={
                        request.deletion
                          ? "/coordinator/registration-requests?type=deletion"
                          : "/coordinator/registration-requests"
                      }
                      onClick={() => setOpen(false)}
                      className="block px-5 py-4 hover:bg-cyan-50"
                    >
                      <p className="break-words text-sm font-medium">
                        {request.name}
                      </p>
                      <p className="mt-1 text-xs text-(--muted)">
                        {request.deletion
                          ? "Exclusão de conta de"
                          : "Cadastro de"}{" "}
                        {request.role === "TEACHER" ? "professor" : "aluno"}{" "}
                        aguardando análise
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/coordinator/registration-requests"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-between border-t border-(--line) px-5 text-sm font-medium text-(--blue-dark)"
              >
                Ver solicitações
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
            </>
          )}
        </section>
      )}
    </div>
  );
}

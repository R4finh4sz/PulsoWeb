"use client";

import { authApi } from "@/integrations/auth/api";
import { refreshSession } from "@/api/client";
import { toSessionUser } from "@/integrations/auth/session";
import { useAuthState } from "@/integrations/auth/state";
import { homeRoutes } from "@/interfaces/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import Button from "@/components/ui/Button";
import { TwoFactorScreen } from "@/components/screens/Login/TwoFactorScreen";
import { RequestErrorModal } from "../RequestErrorModal";

function BlockingDialog({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => event.preventDefault()}
      aria-labelledby="auth-title"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[min(92vw,640px)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-900/60 sm:p-8"
    >
      {children}
    </dialog>
  );
}
function Failure({ error }: { error: Error | null }) {
  return <RequestErrorModal error={error} />;
}
function AuthorizedGate({ children }: { children: ReactNode }) {
  const session = useAuthState((state) => state.session);
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const [checkedVersion, setCheckedVersion] = useState<string | null>(null);

  const terms = useQuery({
    queryKey: ["terms"],
    queryFn: ({ signal }) => authApi.terms(signal),
    staleTime: 0,
  });
  const accepted = useQuery({
    queryKey: ["terms-accepted"],
    queryFn: ({ signal }) => authApi.accepted(signal),
    staleTime: 0,
  });
  const checked = !!terms.data && checkedVersion === terms.data.version;
  const hasAccepted =
    session?.user.termsAccepted === true &&
    !!terms.data &&
    !!accepted.data?.includes(terms.data.version);
  const accept = useMutation({
    mutationFn: async () => {
      if (!terms.data || !checked)
        throw new Error("Leia e aceite os termos para continuar.");
      const version = terms.data.version;
      const current = useAuthState.getState().session;
      await authApi.accept(version);
      const latest = useAuthState.getState().session;
      if (current && latest?.accessToken === current.accessToken) {
        useAuthState.getState().setSession({
          ...latest,
          user: {
            ...latest.user,
            termsAccepted: true,
            termsAcceptedVersions: [
              ...new Set([
                ...(latest.user.termsAcceptedVersions ?? []),
                version,
              ]),
            ],
          },
        });
      }
      await client.invalidateQueries({ queryKey: ["terms-accepted"] });
    },
    onError: () => {
      setCheckedVersion(null);
      void terms.refetch();
    },
  });
  const noTerms = terms.isSuccess && terms.data === null;
  const missingRequiredTerms = noTerms && session?.user.termsAccepted === false;
  const ready =
    ((noTerms && !missingRequiredTerms) || hasAccepted) &&
    !terms.isError &&
    !accepted.isError;
  const me = useQuery({
    queryKey: ["session"],
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: ready,
    retry: false,
    staleTime: 0,
  });
  const user = ready && me.data ? toSessionUser(me.data) : null;
  useEffect(() => {
    if (
      user &&
      (pathname === "/" ||
        (!pathname.startsWith(homeRoutes[user.role] + "/") &&
          pathname !== homeRoutes[user.role]))
    )
      router.replace(homeRoutes[user.role]);
  }, [user, pathname, router]);
  if (terms.isPending || accepted.isPending)
    return (
      <p role="status" className="p-8">
        Verificando termos de uso…
      </p>
    );
  if (terms.error || accepted.error || missingRequiredTerms)
    return (
      <BlockingDialog>
        <h1 id="auth-title">Não foi possível verificar os termos</h1>
        <Failure
          error={
            terms.error ||
            accepted.error ||
            new Error(
              "Os termos de uso precisam ser aceitos, mas não estão disponíveis. Tente novamente mais tarde.",
            )
          }
        />
        <Button
          onClick={() => {
            void terms.refetch();
            void accepted.refetch();
          }}
        >
          Tentar novamente
        </Button>
      </BlockingDialog>
    );
  if (!noTerms && !hasAccepted)
    return (
      <BlockingDialog>
        <h1 id="auth-title" className="text-xl font-semibold">
          Termos de uso
        </h1>
        <p className="mt-5 text-xs text-slate-500">
          Versão {terms.data?.version}
        </p>
        <div
          tabIndex={0}
          className="my-5 max-h-[45dvh] overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-6"
        >
          {terms.data?.content}
        </div>
        <label className="mb-5 flex gap-3 text-sm">
          <input
            type="checkbox"
            checked={checked}
            disabled={accept.isPending}
            onChange={(event) =>
              setCheckedVersion(
                event.target.checked ? terms.data!.version : null,
              )
            }
          />
          Li e aceito os termos de uso.
        </label>
        <Failure error={accept.error} />
        <Button
          disabled={!checked || accept.isPending || terms.isFetching}
          onClick={() => accept.mutate()}
        >
          {accept.isPending ? "Registrando aceite…" : "Aceitar e continuar"}
        </Button>
      </BlockingDialog>
    );
  if (me.error)
    return (
      <main className="p-8">
        <Failure error={me.error} />
        <Button onClick={() => me.refetch()}>Tentar novamente</Button>
      </main>
    );
  if (
    !user ||
    pathname === "/" ||
    !(
      pathname === homeRoutes[user.role] ||
      pathname.startsWith(homeRoutes[user.role] + "/")
    )
  )
    return (
      <p role="status" className="p-8">
        Carregando seu espaço…
      </p>
    );
  return children;
}
const subscribe = () => () => {};
export function AuthGate({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const session = useAuthState((state) => state.session);
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const pathname = usePathname();
  const router = useRouter();
  const publicRegistration =
    pathname === "/registration" ||
    pathname.startsWith("/invite/") ||
    pathname === "/forgot-password";
  useEffect(() => {
    if (!mounted) return;
    if (session?.user.role === "STUDENT") {
      useAuthState.getState().setSession(null);
      void client.cancelQueries();
      client.clear();
      router.replace("/");
      return;
    }
    if (!session) {
      if (pathname !== "/" && !publicRegistration) router.replace("/");
      return;
    }
    const remaining = Date.parse(session.expiresAt) - Date.now();
    if (!(remaining > 0)) {
      void refreshSession().catch(() => undefined);
      return;
    }
    const timer = setTimeout(
      () => {
        if (Date.parse(session.expiresAt) <= Date.now())
          void refreshSession().catch(() => undefined);
      },
      Math.min(remaining, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [session, mounted, pathname, router, publicRegistration, client]);
  if (!mounted)
    return (
      <p role="status" className="p-8">
        Carregando…
      </p>
    );
  if (session?.user.role === "STUDENT")
    return (
      <p role="status" className="p-8">
        Voltando ao login…
      </p>
    );
  if (publicRegistration) return children;
  if (!session)
    return pathname === "/" ? (
      children
    ) : (
      <p role="status" className="p-8">
        Entre para continuar…
      </p>
    );
  if (session.twoFactorRequired) return <TwoFactorScreen session={session} />;
  return <AuthorizedGate>{children}</AuthorizedGate>;
}

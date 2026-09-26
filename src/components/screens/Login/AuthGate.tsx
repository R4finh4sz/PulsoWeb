"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/integrations/auth/api";
import { useAuthState } from "@/integrations/auth/state";
import { toSessionUser } from "@/integrations/auth/session";
import { homeRoutes } from "@/interfaces/auth";

import Button from "@/components/ui/Button";
import { TwoFactorScreen } from "./TwoFactorScreen";

function BlockingDialog({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} onCancel={event => event.preventDefault()} aria-labelledby="auth-title"
    className="fixed inset-0 m-auto max-h-[90dvh] w-[min(92vw,640px)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-900/60 sm:p-8">
    {children}
  </dialog>;
}
function Failure({ error }: { error: Error | null }) {
  return error ? <p role="alert" className="my-4 text-sm text-red-700">{error.message}</p> : null;
}
function AuthorizedGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const [reading, setReading] = useState(false);
  const [checkedVersion, setCheckedVersion] = useState<string | null>(null);


  const terms = useQuery({ queryKey: ["terms"], queryFn: ({ signal }) => authApi.terms(signal), staleTime: 0 });
  const accepted = useQuery({ queryKey: ["terms-accepted"], queryFn: ({ signal }) => authApi.accepted(signal), staleTime: 0 });
  const checked = !!terms.data && checkedVersion === terms.data.version;
  const hasAccepted = !!terms.data && !!accepted.data?.includes(terms.data.version);
  const accept = useMutation({ mutationFn: async () => {
    if (!terms.data || !checked) throw new Error("Leia e aceite os termos para continuar.");
    await authApi.accept(terms.data.version);
    await client.invalidateQueries({ queryKey: ["terms-accepted"] });
  }, onError: () => { setCheckedVersion(null); void terms.refetch(); } });
  const noTerms = terms.isSuccess && terms.data === null;
  const ready = (noTerms || hasAccepted) && !terms.isError && !accepted.isError;
  const me = useQuery({ queryKey: ["session"], queryFn: ({ signal }) => authApi.me(signal), enabled: ready, retry: false, staleTime: 0 });
  const user = ready && me.data ? toSessionUser(me.data) : null;
  useEffect(() => {
    if (user && (pathname === "/" || !pathname.startsWith(homeRoutes[user.role] + "/") && pathname !== homeRoutes[user.role])) router.replace(homeRoutes[user.role]);
  }, [user, pathname, router]);
  if (terms.isPending || accepted.isPending) return <p role="status" className="p-8">Verificando termos de uso…</p>;
  if (terms.error || accepted.error) return <BlockingDialog><h1 id="auth-title">Não foi possível verificar os termos</h1><Failure error={terms.error || accepted.error} /><Button onClick={() => { void terms.refetch(); void accepted.refetch(); }}>Tentar novamente</Button></BlockingDialog>;
  if (!noTerms && !hasAccepted) return <BlockingDialog>
    <h1 id="auth-title" className="text-xl font-semibold">Termos de uso</h1>
    {!reading ? <><p className="my-5 text-sm">Para acessar o Pulso Escolar, você precisa ler e aceitar os termos de uso.</p><Button onClick={() => setReading(true)}>Ler termos de uso</Button></> : <>
      <h2 className="mt-5 font-semibold">{terms.data?.title}</h2><p className="text-xs text-slate-500">Versão {terms.data?.version}</p>
      <div tabIndex={0} className="my-5 max-h-[45dvh] overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-6">{terms.data?.content}</div>
      <label className="mb-5 flex gap-3 text-sm"><input type="checkbox" checked={checked} disabled={accept.isPending} onChange={event => setCheckedVersion(event.target.checked ? terms.data!.version : null)} />Li e aceito os termos de uso.</label>
      <Failure error={accept.error} /><Button disabled={!checked || accept.isPending || terms.isFetching} onClick={() => accept.mutate()}>{accept.isPending ? "Registrando aceite…" : "Aceitar e continuar"}</Button>
    </>}
  </BlockingDialog>;
  if (me.error) return <main className="p-8"><Failure error={me.error} /><Button onClick={() => me.refetch()}>Tentar novamente</Button></main>;
  if (!user || pathname === "/" || !(pathname === homeRoutes[user.role] || pathname.startsWith(homeRoutes[user.role] + "/"))) return <p role="status" className="p-8">Carregando seu espaço…</p>;
  return children;
}
const subscribe = () => () => {};
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useAuthState(state => state.session);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!mounted) return;
    if (!session) { if (pathname !== "/") router.replace("/"); return; }
    const remaining = Date.parse(session.expiresAt) - Date.now();
    if (!(remaining > 0)) { useAuthState.getState().setSession(null); return; }
    const timer = setTimeout(() => useAuthState.getState().setSession(null), Math.min(remaining, 2147483647));
    return () => clearTimeout(timer);
  }, [session, mounted, pathname, router]);
  if (!mounted) return <p role="status" className="p-8">Carregando…</p>;
  if (!session) return pathname === "/" ? children : <p role="status" className="p-8">Entre para continuar…</p>;
  if (session.twoFactorRequired) return <TwoFactorScreen session={session} />;
  return <AuthorizedGate>{children}</AuthorizedGate>;
}

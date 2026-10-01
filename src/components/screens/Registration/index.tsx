"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { authApi } from "@/integrations/auth/api";
import { registrationApi } from "@/integrations/registration/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { ErrorMessage } from "../Integration/shared";
import { LoginIntro } from "../Login/LoginIntro";

export function Registration({ token }: { token?: string }) {
  const [search, setSearch] = useState("");
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [done, setDone] = useState(false);
  const [verified, setVerified] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [now, setNow] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const terms = useQuery({ queryKey: ["registration-terms"], queryFn: ({ signal }) => authApi.terms(signal) });
  const schools = useQuery({ queryKey: ["school-search", search], queryFn: ({ signal }) => registrationApi.schools(search, signal), enabled: !token });
  const invitation = useQuery({ queryKey: ["invitation", token], queryFn: ({ signal }) => registrationApi.invitation(token!, signal), enabled: !!token, retry: false });
  const verify = useMutation({ mutationFn: (code: string) => registrationApi.verify(token!, code), onSuccess: () => setVerified(true) });
  const resend = useMutation({ mutationFn: () => registrationApi.resend(token!), onSuccess: data => { invitation.refetch(); setDigits(Array(6).fill("")); setError(null); return data; } });
  const mutation = useMutation({ mutationFn: async (data: FormData) => {
    if (!terms.data || acceptedVersion !== terms.data.version) throw new Error("Leia e aceite os termos atuais.");
    const name = String(data.get("name")).trim();
    const password = String(data.get("password"));
    if (!/\S+\s+\S+/.test(name)) throw new Error("Informe nome e sobrenome.");
    if (password !== data.get("confirmPassword")) throw new Error("As senhas precisam ser iguais.");
    if (new TextEncoder().encode(password).length > 72) throw new Error("A senha deve ter no máximo 72 bytes. Use menos caracteres especiais.");
    if (token && (!/[A-Z]/.test(password) || !/[0-9]/.test(password))) throw new Error("A senha deve conter uma letra maiúscula e um número.");
    const common = { name, ra: String(data.get("ra")), password, termsAccepted: true, termsVersion: terms.data.version };
    if (token) return registrationApi.complete(token, common);
    const photo = data.get("photo");
    if (photo instanceof File && photo.size > 2 * 1024 * 1024) throw new Error("A foto deve ter no máximo 2 MB.");
    return registrationApi.register({ ...common, email: String(data.get("email")).trim(), birthDate: String(data.get("birthDate")), schoolId: Number(data.get("schoolId")) }, photo instanceof File && photo.size ? photo : undefined);
  }, onSuccess: () => setDone(true) });
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); if (mutation.isPending) return; setError(null);
    try { await mutation.mutateAsync(new FormData(event.currentTarget)); } catch (failure) { setError(failure instanceof Error ? failure : new Error("Não foi possível enviar o cadastro.")); }
  }
  function enterDigits(index: number, value: string) {
    const incoming = value.replace(/\D/g, "").slice(0, 6);
    const start = incoming.length === 6 ? 0 : index;
    setDigits(current => {
      const next = [...current];
      if (!incoming) next[index] = "";
      else for (let offset = 0; offset < incoming.length && start + offset < 6; offset++) next[start + offset] = incoming[offset];
      return next;
    });
    verify.reset();
    if (incoming) inputs.current[Math.min(start + incoming.length, 5)]?.focus();
  }
  return <main className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
    <LoginIntro />
    <section className="flex items-center justify-center px-6 py-14 sm:px-12"><div className="w-full max-w-[480px] space-y-6 rise-in">
      <div><h1 className="text-3xl font-semibold">{done ? "Cadastro enviado" : token ? "Complete seu cadastro" : "Crie sua conta de aluno"}</h1><p className="mt-3 text-sm text-(--muted)">{done ? "Sua solicitação será analisada pelo responsável. Você poderá entrar após a aprovação." : "Faça parte do Pulso Escolar."}</p></div>
      {done ? <Link href="/" className="text-(--blue) underline">Voltar para o login</Link> : token && invitation.isPending ? <p role="status">Carregando convite…</p> : token && invitation.error ? <ErrorMessage error={invitation.error} /> : token && !verified && !invitation.data?.verified ? <form className="space-y-5" onSubmit={event => { event.preventDefault(); verify.mutate(digits.join("")); }}>
        <p className="text-sm">Enviamos um código para {invitation.data?.email}. Confirme seu e-mail para continuar.</p>
        <fieldset disabled={verify.isPending || resend.isPending} className="space-y-3"><legend className="block text-xs font-bold text-(--ink)">Código de confirmação</legend><div className="flex justify-center gap-2 sm:gap-2.5">{digits.map((digit, index) => <input key={index} ref={element => { inputs.current[index] = element; }} aria-label={`Dígito ${index + 1} de 6`} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} name={`code-${index + 1}`} pattern="[0-9]" required value={digit} placeholder="0" onFocus={event => event.target.select()} onChange={event => enterDigits(index, event.target.value)} onPaste={event => { event.preventDefault(); enterDigits(index, event.clipboardData.getData("text")); }} onKeyDown={event => { if (event.key === "Backspace" && !digit && index > 0) { event.preventDefault(); enterDigits(index - 1, ""); inputs.current[index - 1]?.focus(); } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); inputs.current[Math.max(0, Math.min(5, index + (event.key === "ArrowLeft" ? -1 : 1)))]?.focus(); } }} className={`h-14 w-10 rounded-lg border text-center text-xl font-semibold text-[#283b40] outline-none transition placeholder:text-[#9da5a8] focus:border-[#00a2cb] focus:bg-[#e7f5f8] focus:ring-2 focus:ring-[#00a2cb]/20 disabled:opacity-60 sm:w-12 ${digit ? "border-[#00a2cb] bg-[#d0e4e9]" : "border-transparent bg-[#d1dfe3]"}`} />)}</div></fieldset>
        <ErrorMessage error={verify.error || resend.error} />
        <Button type="submit" disabled={verify.isPending || resend.isPending || digits.join("").length !== 6}>{verify.isPending ? "Confirmando…" : "Confirmar e-mail"}</Button>
        <Button type="button" disabled={resend.isPending || (!!invitation.data && Date.parse(invitation.data.resendAvailableAt) > now)} onClick={() => resend.mutate()}>Reenviar código</Button>
      </form> : <form onSubmit={submit} className="space-y-5">
        {token && <p className="text-sm">{invitation.data?.email} · {invitation.data?.schoolName}</p>}
        <Input id="name" name="name" label="Nome completo" autoComplete="name" required maxLength={token ? 100 : 50} />
        {!token && <><Input id="birthDate" name="birthDate" label="Data de nascimento" type="date" required max={now ? new Date(now - 86400000).toISOString().slice(0, 10) : undefined} /><Input id="email" name="email" label="E-mail" type="email" autoComplete="email" required maxLength={254} /></>}
        <Input id="ra" name="ra" label="RA / matrícula" required inputMode="numeric" pattern="[0-9]+" maxLength={token ? 50 : 30} />
        {!token && <><Input id="schoolSearch" label="Buscar escola" placeholder="Nome da escola" value={search} onChange={event => setSearch(event.target.value)} /><Select key={search} id="schoolId" name="schoolId" label="Escola" required disabled={schools.isPending || schools.isError} defaultValue=""><option value="">Selecione sua escola</option>{schools.data?.content.map(school => <option key={school.id} value={school.id}>{school.name} · {school.city}/{school.state}</option>)}</Select><ErrorMessage error={schools.error} />{schools.isSuccess && !schools.data.content.length && <p role="status" className="text-sm">Nenhuma escola encontrada. Ajuste a busca.</p>}<Input id="photo" name="photo" type="file" accept="image/png,image/jpeg" label="Foto de perfil (opcional)" /></>}
        <Input id="password" name="password" label="Senha" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        <p className="text-xs text-(--muted)">Use de 8 a 72 caracteres{token ? ", incluindo uma letra maiúscula e um número" : ""}.</p>
        <Input id="confirmPassword" name="confirmPassword" label="Confirme sua senha" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        {terms.isPending && <p role="status">Carregando termos…</p>}<ErrorMessage error={terms.error} />
        {terms.data && <><details className="rounded-xl border border-(--line) p-4"><summary className="cursor-pointer text-sm font-semibold">{terms.data.title} · {terms.data.version}</summary><div className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-6">{terms.data.content}</div></details><label className="flex gap-3 text-sm"><input type="checkbox" required checked={acceptedVersion === terms.data.version} onChange={event => setAcceptedVersion(event.target.checked ? terms.data!.version : null)} />Li e aceito os termos de uso.</label></>}
        {terms.isSuccess && !terms.data && <p role="alert">O cadastro estará disponível quando os termos forem publicados.</p>}
        <ErrorMessage error={error} /><Button type="submit" disabled={mutation.isPending || !terms.data || acceptedVersion !== terms.data.version}>{mutation.isPending ? "Enviando…" : "Enviar cadastro"}</Button>
        <p className="text-center text-sm"><Link href="/" className="text-(--blue) underline">Já tenho uma conta</Link></p>
      </form>}
    </div></section>
  </main>;
}

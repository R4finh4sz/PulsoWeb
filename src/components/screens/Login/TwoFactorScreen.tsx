"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Timer } from "lucide-react";
import logo from "@/assets/images/LogoImage.png";
import illustration from "@/assets/images/LoginImage.png";
import { authApi } from "@/integrations/auth/api";
import { useAuthState, type LoginResponse } from "@/integrations/auth/state";
import Button from "@/components/ui/Button";

export function TwoFactorScreen({ session }: { session: LoginResponse }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [now, setNow] = useState(() => Date.now());
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const submitting = useRef(false);
  const code = digits.join("");

  useEffect(() => {
    inputs.current[0]?.focus();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const verify = useMutation({
    mutationFn: () => authApi.verify(code),
    onSuccess: () => useAuthState.getState().setSession({ ...session, twoFactorRequired: false }),
    onSettled: () => { submitting.current = false; },
  });
  const resend = useMutation({
    mutationFn: authApi.resend,
    onSuccess: timing => {
      setDigits(Array(6).fill(""));
      verify.reset();
      setNow(Date.now());
      useAuthState.getState().setSession({ ...session, ...timing });
    },
    onSettled: () => {
      submitting.current = false;
      requestAnimationFrame(() => inputs.current[0]?.focus());
    },
  });

  const resendIn = Math.max(0, Math.ceil((Date.parse(session.resendAvailableAt) - now) / 1000));
  const expiresIn = Math.max(0, Math.ceil((Date.parse(session.codeExpiresAt) - now) / 1000));
  const countdown = `${Math.floor(expiresIn / 60).toString().padStart(2, "0")}:${(expiresIn % 60).toString().padStart(2, "0")}`;
  const busy = verify.isPending || resend.isPending;
  const error = verify.error || resend.error;

  function enterDigits(index: number, value: string) {
    const incoming = value.replace(/\D/g, "").slice(0, 6);
    // Autofill can deliver the entire code to any of the six fields.
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

  return (
    <main className="min-h-dvh bg-white lg:grid lg:grid-cols-[0.965fr_1.035fr]">
      <section aria-labelledby="verification-intro" className="flex flex-col bg-[#008ead] px-7 py-10 text-white sm:px-14 lg:min-h-dvh lg:px-[10%] lg:pb-14 lg:pt-[14vh]">
        <p className="text-xs font-semibold">Verificação em duas etapas</p>
        <h1 id="verification-intro" className="mt-2 max-w-[360px] text-3xl font-bold leading-snug">Mais segurança<br />para o seu acesso</h1>
        <p className="mt-3 max-w-[330px] text-xs leading-relaxed">Enviamos um código de verificação para seu e-mail cadastrado. Informe o código para continuar com segurança.</p>
        <div className="mx-auto mt-auto hidden w-full max-w-[410px] pt-16 lg:block">
          <Image src={illustration} alt="" sizes="410px" className="h-auto w-full" />
        </div>
      </section>

      <section aria-labelledby="verification-title" className="flex flex-col items-center px-5 py-10 sm:px-12 lg:min-h-dvh lg:px-16 lg:pb-10 lg:pt-[12vh]">
        <Image src={logo} alt="Pulso Escolar" preload sizes="(max-width: 380px) 260px, 320px" className="h-auto w-full max-w-[320px]" />
        <h2 id="verification-title" className="mt-8 text-center text-base font-semibold text-[#008ead]">Confirme seu acesso</h2>
        <p className="mt-2 text-center text-xs text-[var(--ink)]">Digite o código enviado para seu e-mail</p>

        <form className="mt-10 flex w-full max-w-[440px] flex-1 flex-col items-center" onSubmit={event => {
          event.preventDefault();
          if (submitting.current || busy || code.length !== 6 || expiresIn === 0) return;
          submitting.current = true;
          verify.mutate();
        }}>
          <fieldset disabled={busy} aria-describedby="code-expiration code-error" className="flex justify-center gap-2 sm:gap-2.5">
            <legend className="sr-only">Código de verificação de seis dígitos</legend>
            {digits.map((digit, index) => (
              <input key={index} ref={element => { inputs.current[index] = element; }}
                aria-label={`Dígito ${index + 1} de 6`} aria-invalid={!!verify.error}
                type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"}
                name={`code-${index + 1}`} pattern="[0-9]" required value={digit} placeholder="0"
                onFocus={event => event.target.select()}
                onChange={event => enterDigits(index, event.target.value)}
                onPaste={event => {
                  event.preventDefault();
                  enterDigits(index, event.clipboardData.getData("text"));
                }}
                onKeyDown={event => {
                  if (event.key === "Backspace" && !digit && index > 0) {
                    event.preventDefault();
                    enterDigits(index - 1, "");
                    inputs.current[index - 1]?.focus();
                  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    inputs.current[Math.max(0, Math.min(5, index + (event.key === "ArrowLeft" ? -1 : 1)))]?.focus();
                  }
                }}
                className={`h-14 w-10 rounded-lg border text-center text-xl font-semibold text-[#283b40] outline-none transition placeholder:text-[#9da5a8] focus:border-[#00a2cb] focus:bg-[#e7f5f8] focus:ring-2 focus:ring-[#00a2cb]/20 disabled:opacity-60 sm:w-12 ${digit ? "border-[#00a2cb] bg-[#d0e4e9]" : "border-transparent bg-[#d1dfe3]"}`}
              />
            ))}
          </fieldset>

          <p id="code-expiration" className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#707070]">
            <Timer aria-hidden="true" className="h-3.5 w-3.5" />
            {expiresIn > 0 ? <>Código expira em <span className="ml-1 tabular-nums text-[#009ec3]">{countdown}</span></> : <span role="status">Código expirado. Solicite um novo código.</span>}
          </p>
          <div id="code-error" className="mt-4 min-h-6 text-center text-sm text-red-700">{error && <p role="alert">{error.message}</p>}</div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-sm sm:mt-12">
            <span className="text-[#707070]">Não recebeu o código?</span>
            <button type="button" disabled={resendIn > 0 || busy} className="rounded font-semibold text-[#009ec3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#009ec3] disabled:opacity-50" onClick={() => {
              if (submitting.current) return;
              submitting.current = true;
              resend.mutate();
            }}>{resend.isPending ? "Reenviando…" : resendIn > 0 ? `Reenviar em ${resendIn}s` : "Reenviar"}</button>
          </div>

          <div className="mt-16 w-full pb-2 lg:mt-auto lg:pt-20">
            <Button type="submit" disabled={busy || code.length !== 6 || expiresIn === 0} className="!h-10 !bg-[#008ead] !text-xs">{verify.isPending ? "Confirmando…" : "Continuar"}</Button>
            <button type="button" disabled={busy} onClick={() => useAuthState.getState().setSession(null)} className="mx-auto mt-5 block rounded text-xs text-[#707070] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#009ec3] disabled:opacity-50">Voltar ao login</button>
          </div>
        </form>
      </section>
    </main>
  );
}

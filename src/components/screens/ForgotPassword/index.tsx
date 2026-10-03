"use client";

import { LoginHeader } from "@/components/screens/Login/LoginHeader";
import { LoginIntro } from "@/components/screens/Login/LoginIntro";
import Button from "@/components/ui/Button";
import { FeedbackModal } from "@/components/ui/FeedbackModal";
import Input from "@/components/ui/Input";
import { authApi } from "@/integrations/auth/api";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type SubmitEvent } from "react";

type Step = "email" | "code" | "password";

export function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showSentModal, setShowSentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");
  const request = useMutation({ mutationFn: authApi.requestPasswordReset });
  const verify = useMutation({ mutationFn: () => authApi.verifyPasswordReset(email, code) });
  const reset = useMutation({ mutationFn: ({ password, confirmation }: { password: string; confirmation: string }) => {
    if (!resetToken) throw new Error("O token de recuperação não está disponível.");
    return authApi.resetPassword(email, resetToken, password, confirmation);
  } });

  useEffect(() => {
    if (step === "code") requestAnimationFrame(() => inputs.current[0]?.focus());
  }, [step]);

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

  async function submitEmail(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await request.mutateAsync(email.trim());
      setShowSentModal(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível enviar o código.");
    }
  }

  async function submitCode(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const result = await verify.mutateAsync();
      setResetToken(result.resetToken);
      setStep("password");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível verificar o código.");
    }
  }

  async function submitPassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmPassword"));
    if (password !== confirmation) { setError("As senhas precisam ser iguais."); return; }
    setError(null);
    try {
      await reset.mutateAsync({ password, confirmation });
      setStep("email");
      setDigits(Array(6).fill(""));
      setResetToken(null);
      setShowSentModal(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível redefinir a senha.");
    }
  }

  const busy = request.isPending || verify.isPending || reset.isPending;
  const titles = { email: "Esqueceu sua senha?", code: "Verifique seu e-mail", password: "Crie uma nova senha" };
  const descriptions = { email: "Informe seu e-mail para recuperar o acesso à plataforma.", code: `Digite o código enviado para ${email}.`, password: "Escolha uma senha segura para acessar sua conta." };

  return <main className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
    <LoginIntro />
    <section aria-labelledby="forgot-password-title" className="flex min-h-screen items-center justify-center px-6 py-14 sm:px-12 lg:px-20">
      <div className="w-full max-w-[480px] rise-in rise-in-delay">
        <LoginHeader title={titles[step]} description={descriptions[step]} />
        {step === "email" && <form onSubmit={submitEmail} className="space-y-6"><Input id="recovery-email" name="email" label="E-mail" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="Digite seu e-mail..." /><Button type="submit" disabled={busy}>{request.isPending ? "Enviando…" : "Enviar código"}</Button></form>}
        {step === "code" && <form onSubmit={submitCode} className="space-y-6"><fieldset disabled={busy} className="space-y-3"><legend className="block text-xs font-bold text-(--ink)">Código de verificação</legend><div className="flex justify-center gap-2 sm:gap-2.5">{digits.map((digit, index) => <input key={index} ref={element => { inputs.current[index] = element; }} aria-label={`Dígito ${index + 1} de 6`} aria-invalid={!!error} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} name={`code-${index + 1}`} pattern="[0-9]" required value={digit} placeholder="0" onFocus={event => event.target.select()} onChange={event => enterDigits(index, event.target.value)} onPaste={event => { event.preventDefault(); enterDigits(index, event.clipboardData.getData("text")); }} onKeyDown={event => { if (event.key === "Backspace" && !digit && index > 0) { event.preventDefault(); enterDigits(index - 1, ""); inputs.current[index - 1]?.focus(); } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); inputs.current[Math.max(0, Math.min(5, index + (event.key === "ArrowLeft" ? -1 : 1)))]?.focus(); } }} className={`h-14 w-10 rounded-lg border text-center text-xl font-semibold text-[#283b40] outline-none transition placeholder:text-[#9da5a8] focus:border-[#00a2cb] focus:bg-[#e7f5f8] focus:ring-2 focus:ring-[#00a2cb]/20 disabled:opacity-60 sm:w-12 ${digit ? "border-[#00a2cb] bg-[#d0e4e9]" : "border-transparent bg-[#d1dfe3]"}`} />)}</div></fieldset><Button type="submit" disabled={busy || code.length !== 6}>{verify.isPending ? "Verificando…" : "Verificar código"}</Button></form>}
        {step === "password" && <form onSubmit={submitPassword} className="space-y-6"><Input id="new-password" name="password" label="Nova senha" type="password" autoComplete="new-password" minLength={8} required placeholder="Digite sua nova senha..." /><Input id="confirm-password" name="confirmPassword" label="Repita a nova senha" type="password" autoComplete="new-password" minLength={8} required placeholder="Repita sua nova senha..." /><Button type="submit" disabled={busy}>{reset.isPending ? "Salvando…" : "Redefinir senha"}</Button></form>}
        {error && <p role="alert" className="mt-4 text-center text-sm text-red-600">{error}</p>}
        <Link href="/" className="mx-auto mt-8 flex w-fit items-center gap-2 text-xs text-(--blue) hover:underline"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar ao login</Link>
      </div>
    </section>
    {showSentModal && <FeedbackModal type="success" title="Verifique seu e-mail" message="Se este e-mail estiver cadastrado, enviaremos um código para continuar a recuperação da sua senha." actionLabel="Continuar" onClose={() => { setShowSentModal(false); setStep("code"); }} />}
  </main>;
}

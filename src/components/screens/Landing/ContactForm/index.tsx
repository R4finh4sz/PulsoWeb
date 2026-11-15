"use client";

import { useState, type FormEvent } from "react";

export const CONTACT_EMAIL = "rafael.souza6657@gmail.com";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-(--line) bg-white px-4 py-3 text-base text-(--ink) transition-colors focus:border-(--blue) focus:outline-none";

export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const head = `(${d.slice(0, 2)}) `;
  return d.length <= 10
    ? `${head}${d.slice(2, 6)}${d.length > 6 ? `-${d.slice(6)}` : ""}`
    : `${head}${d.slice(2, 7)}-${d.slice(7)}`;
}

export function buildMailto(data: Record<string, string>) {
  const subject = `Pulso Escolar – interesse da escola ${data.school}`;
  const body = [
    `Escola: ${data.school}`,
    `Responsável: ${data.name}`,
    `Cargo: ${data.role || "Não informado"}`,
    `Telefone: ${data.phone || "Não informado"}`,
    `E-mail para retorno: ${data.email}`,
    `Nº aproximado de alunos: ${data.students || "Não informado"}`,
    "",
    data.message || "Gostaria de conhecer o Pulso Escolar.",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [phone, setPhone] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    window.location.href = buildMailto(data);
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left" aria-label="Contato da escola">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Nome da escola *
          <input name="school" maxLength={80} placeholder="Ex.: Escola Municipal Aurora" required autoComplete="organization" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          Seu nome *
          <input name="name" maxLength={80} placeholder="Ex.: Maria Silva" required autoComplete="name" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          Cargo
          <input name="role" maxLength={50} placeholder="Ex.: Coordenador(a)" autoComplete="organization-title" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          Seu e-mail *
          <input name="email" maxLength={100} type="email" placeholder="Ex.: maria@escola.com.br" required autoComplete="email" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          Telefone
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 91234-5678"
            maxLength={15}
            value={phone}
            onChange={(event) => setPhone(maskPhone(event.target.value))}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Nº aproximado de alunos
          <input name="students" inputMode="numeric" maxLength={6} pattern="[0-9]*" onInput={(event) => (event.currentTarget.value = event.currentTarget.value.replace(/\D/g, ""))} placeholder="Ex.: 500" className={fieldClass} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Mensagem
        <textarea name="message" rows={4} maxLength={500} placeholder="Conte como podemos ajudar sua escola." className={`${fieldClass} resize-y`} />
      </label>
      <button
        type="submit"
        className="min-h-12 w-full rounded-xl bg-(--blue-dark) px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#076a83]"
      >
        Enviar e-mail
      </button>
      <p role="status" className="text-sm text-(--muted)">
        {sent
          ? "Abrimos seu aplicativo de e-mail com a mensagem pronta. Se nada abrir, escreva para "
          : "Ao clicar, abriremos seu aplicativo de e-mail com a mensagem pronta para enviar. Ou escreva direto para "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-(--blue-dark) underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </form>
  );
}

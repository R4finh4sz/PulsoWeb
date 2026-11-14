"use client";

import {
  actionClass,
  ErrorMessage,
  fieldClass,
} from "@/components/screens/Integration/shared";
import { BackLink } from "@/components/ui/BackLink";
import Input from "@/components/ui/Input";
import { faqsApi, type Faq } from "@/integrations/faqs/api";
import type { SessionUser } from "@/interfaces/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { faqRoles } from "./roles";

export function FaqForm({ faq }: { faq?: Faq }) {
  const router = useRouter();
  const client = useQueryClient();
  const [validation, setValidation] = useState("");
  const save = useMutation({
    mutationFn: (body: Pick<Faq, "title" | "message" | "targetRole">) =>
      faq?.id != null ? faqsApi.update(faq.id, body) : faqsApi.create(body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["faqs"] });
      router.push("/admin/faq");
    },
  });
  return (
    <form
      className="max-w-3xl space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (save.isPending) return;
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "").trim();
        const message = String(data.get("message") ?? "").trim();
        const targetRole = String(data.get("targetRole") ?? "");
        if (!title || !message || !Object.keys(faqRoles).includes(targetRole)) {
          setValidation("Preencha a pergunta, a resposta e o perfil.");
          return;
        }
        setValidation("");
        save.mutate({ title, message, targetRole });
      }}
    >
      <BackLink disabled={save.isPending} />
      <fieldset disabled={save.isPending} className="space-y-5">
        <Input
          id="faq-title"
          name="title"
          label="Pergunta"
          defaultValue={faq?.title}
          required
        />
        <div>
          <label htmlFor="faq-role" className="block text-sm font-medium">
            Perfil
          </label>
          <select
            id="faq-role"
            name="targetRole"
            className={fieldClass}
            defaultValue={faq?.targetRole ?? "TEACHER"}
            required
          >
            {Object.entries(faqRoles).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="faq-message" className="block text-sm font-medium">
            Resposta
          </label>
          <textarea
            id="faq-message"
            name="message"
            className={fieldClass}
            rows={6}
            defaultValue={faq?.message}
            required
          />
        </div>
      </fieldset>
      {validation && <p role="alert">{validation}</p>}
      <ErrorMessage error={save.error} />
      <div className="flex items-center gap-4">
        <button type="submit" className={actionClass} disabled={save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function FaqEditor({ id, user }: { id: string; user: SessionUser }) {
  const query = useQuery({
    queryKey: ["faqs", user.id, user.role],
    queryFn: ({ signal }) => faqsApi.list(signal),
  });
  const faq = query.data?.find((faq) => String(faq.id) === id);
  if (query.isPending) return <p role="status">Carregando pergunta…</p>;
  if (query.isError)
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorMessage error={query.error} />
        <button className={actionClass} onClick={() => void query.refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  if (!faq)
    return (
      <div className="space-y-4">
        <BackLink />
        <p>Pergunta não encontrada.</p>
      </div>
    );
  return <FaqForm key={id} faq={faq} />;
}

import { isValidCnpj, normalizeCnpj } from "@/utils/cnpj";
import { z } from "zod";

export { isValidCnpj, normalizeCnpj } from "@/utils/cnpj";

export const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;

export function normalizeCep(value: string) {
  return value.replace(/\D/g, "");
}

export const SchoolSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da escola.").max(150, "Use até 150 caracteres."),
  cnpj: z.string().transform(normalizeCnpj).refine(isValidCnpj, "Informe um CNPJ válido."),
  cep: z.string().transform(normalizeCep).refine((value) => /^\d{8}$/.test(value), "Informe um CEP válido."),
  street: z.string().trim().min(3, "Informe o logradouro.").max(200, "Use até 200 caracteres."),
  neighborhood: z.string().trim().min(2, "Informe o bairro.").max(100, "Use até 100 caracteres."),
  state: z.string().refine((value) => states.some((state) => state === value), "Selecione um estado."),
  city: z.string().trim().min(2, "Informe a cidade.").max(100, "Use até 100 caracteres."),
});

export type SchoolForm = z.infer<typeof SchoolSchema>;


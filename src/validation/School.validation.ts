import { z } from "zod";

export const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;

export function normalizeCnpj(value: string) {
  return value.trim().toUpperCase().replace(/[.\/\-\s]/g, "");
}

// DV numérico e alfanumérico: módulo 11, com valor ASCII - 48.
export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value);
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false;
  function digit(base: string) {
    let weight = 2;
    let total = 0;
    for (let index = base.length - 1; index >= 0; index--) {
      total += (base.charCodeAt(index) - 48) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = total % 11;
    return remainder < 2 ? "0" : String(11 - remainder);
  }
  const base = cnpj.slice(0, 12);
  const first = digit(base);
  return cnpj.slice(12) === first + digit(base + first);
}

export const SchoolSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da escola.").max(150, "Use até 150 caracteres."),
  cnpj: z.string().transform(normalizeCnpj).refine(isValidCnpj, "Informe um CNPJ válido."),
  street: z.string().trim().min(3, "Informe o logradouro.").max(200, "Use até 200 caracteres."),
  neighborhood: z.string().trim().min(2, "Informe o bairro.").max(100, "Use até 100 caracteres."),
  state: z.string().refine((value) => states.some((state) => state === value), "Selecione um estado."),
  city: z.string().trim().min(2, "Informe a cidade.").max(100, "Use até 100 caracteres."),
});

export type SchoolForm = z.infer<typeof SchoolSchema>;


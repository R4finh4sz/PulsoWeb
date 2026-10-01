export type ViaCepAddress = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export async function findAddressByCep(cep: string, signal?: AbortSignal): Promise<ViaCepAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
  if (!response.ok) throw new Error("Falha na consulta do CEP.");
  const address = await response.json() as ViaCepAddress;
  if (address.erro) return null;
  return {
    ...address,
    logradouro: address.logradouro?.trim(),
    bairro: address.bairro?.trim(),
    localidade: address.localidade?.trim(),
    uf: address.uf?.trim(),
  };
}

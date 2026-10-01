export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

export function normalizeCnpj(value: string) {
  return value.trim().toUpperCase().replace(/[.\/\-\s]/g, "");
}

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

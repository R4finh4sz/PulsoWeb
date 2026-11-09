export function passwordError(password: string): string | null {
  if (new TextEncoder().encode(password).length > 72)
    return "A senha deve ter no máximo 72 bytes UTF-8.";
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return "A senha deve ter pelo menos 8 caracteres, uma letra maiúscula de A a Z e um número.";
  return null;
}

import { Check, Circle } from "lucide-react";

export function PasswordRequirements({
  password,
  confirmation,
}: {
  password: string;
  confirmation: string;
}) {
  const requirements = [
    { label: "Pelo menos 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula de A a Z", met: /[A-Z]/.test(password) },
    { label: "Um número", met: /[0-9]/.test(password) },
    { label: "No máximo 72 bytes UTF-8", met: password.length > 0 && new TextEncoder().encode(password).length <= 72 },
    {
      label: "As senhas são iguais",
      met: password.length > 0 && password === confirmation,
    },
  ];
  return (
    <ul
      id="password-requirements"
      aria-label="Requisitos da senha"
      className="space-y-2 text-xs"
    >
      {requirements.map(({ label, met }) => {
        const Icon = met ? Check : Circle;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 ${met ? "text-green-700" : "text-(--muted)"}`}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="sr-only">{met ? "Atendido: " : "Pendente: "}</span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}

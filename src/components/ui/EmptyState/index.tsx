import { Inbox, type LucideIcon } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title = "Nenhum cadastro encontrado.",
  description,
  icon: Icon = Inbox,
}: Props) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <Icon
        aria-hidden="true"
        size={36}
        strokeWidth={1.5}
        className="mb-4 text-(--blue-dark)"
      />
      <p className="text-base font-medium text-(--ink)">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-(--muted)">
          {description}
        </p>
      )}
    </div>
  );
}

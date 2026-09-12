import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"select"> & { id: string; label: string; error?: string };

export default function Select({ id, label, error, children, ...props }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[var(--ink)]">{label}</label>
      <select {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="mt-2 h-12 w-full rounded-md border border-[var(--line)] bg-white px-4 text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 aria-invalid:border-red-600">{children}</select>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}


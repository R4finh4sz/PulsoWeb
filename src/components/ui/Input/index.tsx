import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"input"> & {
  id: string;
  label: string;
  error?: string;
};

export default function Input({ id, label, error, className = "", "aria-describedby": describedBy, ...props }: Props) {
  const description = [describedBy, error ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label className="block text-xs font-bold text-[var(--ink)]" htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={description}
        className={`mt-2 h-12 w-full rounded-md border border-[var(--line)] bg-white px-4 text-sm font-normal outline-none transition focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 aria-invalid:border-red-600 ${className}`}
      />
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
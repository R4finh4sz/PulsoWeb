import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"select"> & {
  id: string;
  label: string;
  error?: string;
};

export default function Select({
  id,
  label,
  error,
  children,
  ...props
}: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--ink)]"
      >
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-2 h-12 w-full rounded-xl border border-(--line) bg-white px-4 text-sm outline-none focus:border-[var(--blue-dark)] focus:ring-2 focus:ring-[var(--blue)]/15 disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-red-600"
        >
          {children}
        </select>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

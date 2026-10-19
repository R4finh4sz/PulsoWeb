"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState, type ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"input"> & {
  id: string;
  label: string;
  error?: string;
};

export default function Input({
  id,
  label,
  error,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = props.type === "password";
  const description =
    [describedBy, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label
        className="block text-sm font-medium text-[var(--ink)]"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          type={isPassword && passwordVisible ? "text" : props.type}
          id={id}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={description}
          className={`mt-2 h-12 w-full rounded-xl border border-(--line) bg-white px-4 text-sm font-normal outline-none transition-colors duration-150 focus:border-[var(--blue-dark)] focus:ring-2 focus:ring-[var(--blue)]/15 disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-red-600 ${isPassword || props.disabled ? "pr-14" : ""} ${className}`}
        />
        {props.disabled && (
          <LockKeyhole
            aria-hidden="true"
            className="absolute right-3 top-5 h-5 w-5 text-(--muted)"
          />
        )}
        {isPassword && !props.disabled && (
          <button
            type="button"
            aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            title={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setPasswordVisible((value) => !value)}
            className="absolute right-1 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-(--muted) hover:text-(--blue) focus-visible:outline-2 focus-visible:outline-[var(--blue)]"
          >
            {passwordVisible ? (
              <EyeOff aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Eye aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        )}
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

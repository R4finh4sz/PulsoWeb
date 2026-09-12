import type { ComponentPropsWithoutRef } from "react";

export default function Button({ className = "", type = "button", ...props }: ComponentPropsWithoutRef<"button">) {
  return <button {...props} type={type} className={`h-12 w-full rounded-md bg-[var(--blue)] text-sm font-bold text-white shadow-[0_5px_10px_rgba(7,142,172,0.18)] transition hover:bg-[var(--blue-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--blue)]/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}
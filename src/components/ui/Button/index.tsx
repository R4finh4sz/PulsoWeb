import type { ComponentPropsWithoutRef } from "react";

export default function Button({
  className = "",
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      type={type}
      className={`min-h-12 w-full rounded-xl bg-[var(--blue-dark)] px-5 py-3 text-sm font-semibold leading-6 text-white transition-colors duration-150 enabled:hover:bg-[#076a83] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--blue-dark)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

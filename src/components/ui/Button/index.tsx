import type { ComponentPropsWithoutRef } from "react";

export default function Button({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "danger" }) {
  return (
    <button
      {...props}
      type={type}
      className={`min-h-12 w-full rounded-xl px-5 py-3 text-sm font-semibold leading-6 text-white transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-50 ${variant === "danger" ? "bg-[#e83e32] enabled:hover:bg-[#cf3026] focus-visible:outline-[#e83e32]" : "bg-[var(--blue-dark)] enabled:hover:bg-[#076a83] focus-visible:outline-[var(--blue-dark)]"} ${className}`}
    />
  );
}

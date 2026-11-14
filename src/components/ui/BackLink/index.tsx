"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackLink({
  className = "",
  disabled = false,
  beforeBack,
}: {
  className?: string;
  disabled?: boolean;
  beforeBack?: () => void;
}) {
  const router = useRouter();
  const classes = `inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium text-(--blue-dark) hover:underline ${className}`;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (
          !window.dispatchEvent(
            new Event("pulso:before-back", { cancelable: true }),
          )
        )
          return;
        beforeBack?.();
        router.back();
      }}
      className={classes}
    >
      <ArrowLeft aria-hidden="true" size={16} />
      Voltar
    </button>
  );
}

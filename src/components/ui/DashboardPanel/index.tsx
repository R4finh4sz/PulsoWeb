import type { ReactNode } from "react";

export function DashboardPanel({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <h2 id={`${id}-title`} className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}


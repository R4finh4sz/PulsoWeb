"use client";

import { DashboardIcon } from "@/components/ui/DashboardIcon";

export const panelClass = "rounded-2xl border border-(--line) bg-white p-5";

export function Metric({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: "school" | "users" | "chart" | "check";
  tone: string;
}) {
  return (
    <article className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-(--muted)">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`rounded-xl p-3 ${tone}`}>
          <DashboardIcon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-(--muted)">{detail}</p>
    </article>
  );
}

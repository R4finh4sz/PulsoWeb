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

export function ActivityRow({
  icon,
  tone,
  title,
  detail,
  status,
}: {
  icon: "users" | "school" | "check";
  tone: string;
  title: string;
  detail: string;
  status: string;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-(--line) py-4 last:border-b-0 last:pb-0 first:pt-0">
      <span className={`rounded-lg p-2 ${tone}`}>
        <DashboardIcon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-(--muted)">{detail}</p>
      </div>
      <span className="rounded-full bg-[#e6f8ed] px-2.5 py-1 text-[10px] font-medium text-[#168044]">
        {status}
      </span>
    </li>
  );
}

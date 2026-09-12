import { DashboardIcon, type IconName } from "@/components/ui/DashboardIcon";

export function StatCard({ label, value, detail, icon }: { label: string; value: number | string; detail: string; icon: IconName }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        <span className="rounded-xl bg-[#eaf6f8] p-2.5 text-[var(--blue)]"><DashboardIcon name={icon} /></span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}


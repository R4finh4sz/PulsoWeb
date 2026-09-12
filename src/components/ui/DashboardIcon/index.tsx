import {
  ArrowRight,
  BookOpen,
  ChartColumn,
  Check,
  CircleHelp,
  House,
  LogOut,
  School,
  Users,
  type LucideIcon,
} from "lucide-react";

export type IconName = "home" | "school" | "users" | "book" | "chart" | "arrow" | "logout" | "check" | "help";

const icons: Record<IconName, LucideIcon> = {
  home: House,
  school: School,
  users: Users,
  book: BookOpen,
  chart: ChartColumn,
  arrow: ArrowRight,
  logout: LogOut,
  check: Check,
  help: CircleHelp,
};

export function DashboardIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} strokeWidth={1.7} aria-hidden="true" />;
}

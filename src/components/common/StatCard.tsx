import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  tone?: "primary" | "success" | "warning" | "destructive" | "info" | "purple";
}

const tones = {
  primary: "border-blue-300/25 bg-blue-300/15 text-blue-100 shadow-[0_0_22px_rgba(96,165,250,0.35)]",
  info: "border-teal-300/25 bg-teal-300/15 text-teal-100 shadow-[0_0_22px_rgba(45,212,191,0.35)]",
  purple: "border-amber-300/25 bg-amber-300/15 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.35)]",
  destructive: "border-pink-300/25 bg-pink-300/15 text-pink-100 shadow-[0_0_22px_rgba(244,114,182,0.35)]",
  success: "border-violet-300/25 bg-violet-300/15 text-violet-100 shadow-[0_0_22px_rgba(167,139,250,0.35)]",
  warning: "border-amber-300/25 bg-amber-300/15 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.35)]",
};

const cardTones = {
  primary: "border-blue-300/20 bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_48%,#1e3a8a_100%)] shadow-[0_16px_40px_rgba(37,99,235,0.28)] hover:shadow-[0_22px_58px_rgba(37,99,235,0.52)]",
  info: "border-teal-300/20 bg-[linear-gradient(135deg,#065f46_0%,#0f766e_48%,#134e4a_100%)] shadow-[0_16px_40px_rgba(13,148,136,0.26)] hover:shadow-[0_22px_58px_rgba(20,184,166,0.48)]",
  purple: "border-amber-300/20 bg-[linear-gradient(135deg,#92400e_0%,#b45309_48%,#78350f_100%)] shadow-[0_16px_40px_rgba(217,119,6,0.28)] hover:shadow-[0_22px_58px_rgba(245,158,11,0.48)]",
  destructive: "border-pink-300/20 bg-[linear-gradient(135deg,#9d174d_0%,#be185d_48%,#831843_100%)] shadow-[0_16px_40px_rgba(219,39,119,0.28)] hover:shadow-[0_22px_58px_rgba(236,72,153,0.50)]",
  success: "border-violet-300/20 bg-[linear-gradient(135deg,#5b21b6_0%,#6d28d9_48%,#4c1d95_100%)] shadow-[0_16px_40px_rgba(109,40,217,0.30)] hover:shadow-[0_22px_58px_rgba(139,92,246,0.52)]",
  warning: "border-amber-300/20 bg-[linear-gradient(135deg,#92400e_0%,#b45309_48%,#78350f_100%)] shadow-[0_16px_40px_rgba(217,119,6,0.28)] hover:shadow-[0_22px_58px_rgba(245,158,11,0.48)]",
};

export function StatCard({ label, value, icon: Icon, trend, tone = "primary" }: Props) {
  return (
    <Card className={cn("dashboard-stat-card relative isolate h-full gap-0 overflow-hidden rounded-[22px] p-4 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:bg-white/[0.05] before:backdrop-blur-xl hover:-translate-y-1 hover:scale-[1.02] sm:p-5", cardTones[tone])}>
      <div className="flex items-center gap-3">
        <div className={cn("grid size-12 shrink-0 place-items-center rounded-full border shadow-lg", tones[tone])}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</div>
          <div className="truncate text-xs font-medium text-slate-300">{label}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
        {trend !== undefined && trend < 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
        {trend !== undefined ? `${Math.abs(trend)}%` : "12%"} from yesterday
      </div>
    </Card>
  );
}

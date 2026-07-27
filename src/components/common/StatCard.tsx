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
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  purple: "bg-purple/10 text-purple",
};

export function StatCard({ label, value, icon: Icon, trend, tone = "primary" }: Props) {
  return (
    <Card className="dashboard-stat-card p-5 gap-0">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid size-11 place-items-center rounded-2xl", tones[tone])}>
          <Icon className="size-5" />
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</div>
        <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

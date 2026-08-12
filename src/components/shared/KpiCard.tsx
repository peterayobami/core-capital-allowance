import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent: "primary" | "success" | "warning";
}

const ACCENTS = {
  primary: { bar: "bg-primary", iconBg: "bg-primary/10 text-primary" },
  success: { bar: "bg-success", iconBg: "bg-success/10 text-success" },
  warning: { bar: "bg-warning", iconBg: "bg-warning/10 text-warning" },
};

export function KpiCard({ label, value, icon, accent }: KpiCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className="cl-card relative overflow-hidden p-4 min-w-[220px]">
      <div className={cn("absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r-full", a.bar)} />
      <div className="flex items-start justify-between gap-3 pl-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 font-mono text-2xl font-semibold text-foreground tabular-nums">
            {value}
          </div>
        </div>
        <div className={cn("h-8 w-8 rounded-md grid place-items-center shrink-0", a.iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

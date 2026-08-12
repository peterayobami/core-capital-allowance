import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatNGN } from "@/lib/services/ca.service";

export function KpiCard({
  label, value, sublabel, trend, progress, footer,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  trend?: { delta: number; periodLabel: string }; // delta in NGN
  progress?: { pct: number; label?: string };
  footer?: ReactNode;
}) {
  return (
    <div className="data-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      {sublabel && <div className="text-xs text-muted-foreground -mt-1">{sublabel}</div>}
      {trend && (
        <div className={cn(
          "inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
          trend.delta < 0 ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
        )}>
          {trend.delta < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
          <span className="font-mono">{formatNGN(Math.abs(trend.delta))}</span>
          <span className="text-foreground/60 ml-1">{trend.periodLabel}</span>
        </div>
      )}
      {progress && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, Math.max(0, progress.pct))}%` }}
            />
          </div>
          {progress.label && <div className="text-[11px] text-muted-foreground">{progress.label}</div>}
        </div>
      )}
      {footer}
    </div>
  );
}

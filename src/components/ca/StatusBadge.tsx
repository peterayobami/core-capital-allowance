import { cn } from "@/lib/utils";
import type { CAStatus } from "@/lib/models/ca";
import { Shield, Clock, CircleDashed, Lock } from "lucide-react";

export function StatusBadge({ status, size = "sm" }: { status: CAStatus; size?: "sm" | "md" }) {
  const cfg = {
    locked: { cls: "bg-success-soft text-success border-success/20", Icon: Lock, label: "Locked" },
    computed: { cls: "bg-warning-soft text-warning border-warning/20", Icon: Clock, label: "Computed" },
    not_computed: { cls: "bg-secondary text-muted-foreground border-border", Icon: CircleDashed, label: "Not Computed" },
  }[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium",
      size === "sm" ? "text-[11px]" : "text-xs",
      cfg.cls,
    )}>
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export function StatusBanner({ status, fiscalYear }: { status: CAStatus; fiscalYear: number }) {
  const cfg = {
    locked: {
      cls: "bg-success-soft border-success/30 text-success",
      Icon: Shield,
      label: `LOCKED — FY ${fiscalYear} Capital Allowance is final`,
      sub: "Schedule cannot be modified without admin override.",
    },
    computed: {
      cls: "bg-warning-soft border-warning/40 text-warning",
      Icon: Clock,
      label: "COMPUTED — Pending Review & Lock",
      sub: "Review the schedule and lock it to proceed to Tax Computation.",
    },
    not_computed: {
      cls: "bg-secondary border-border text-muted-foreground",
      Icon: CircleDashed,
      label: "NOT COMPUTED",
      sub: "Run Capital Allowance computation to generate the schedule for this fiscal year.",
    },
  }[status];

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3", cfg.cls)}>
      <cfg.Icon className="h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold tracking-wider uppercase">{cfg.label}</div>
        <div className="text-[12px] opacity-90 mt-0.5 text-foreground/70">{cfg.sub}</div>
      </div>
    </div>
  );
}

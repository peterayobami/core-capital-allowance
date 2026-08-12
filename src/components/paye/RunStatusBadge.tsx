import { cn } from "@/lib/utils";
import { Calculator, ShieldCheck, Lock, CircleDashed, AlertCircle, Clock } from "lucide-react";
import type { PayeRunStatus, RemittanceStatus } from "@/lib/models/paye";

export function RunStatusBadge({ status, size = "sm" }: { status: PayeRunStatus; size?: "sm" | "md" }) {
  const cfg = {
    no_run:    { cls: "bg-secondary text-muted-foreground border-border",        Icon: CircleDashed, label: "Not Run" },
    computed:  { cls: "bg-warning-soft text-warning border-warning/30",          Icon: Calculator,   label: "Computed" },
    approved:  { cls: "bg-accent-soft text-accent border-accent/30",             Icon: ShieldCheck,  label: "Approved" },
    locked:    { cls: "bg-success-soft text-success border-success/20",          Icon: Lock,         label: "Locked" },
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

export function RemittanceBadge({ status, size = "sm" }: { status: RemittanceStatus; size?: "sm" | "md" }) {
  const cfg = {
    not_due:   { cls: "bg-secondary text-muted-foreground border-border",   Icon: CircleDashed, label: "Not Due" },
    pending:   { cls: "bg-warning-soft text-warning border-warning/30",     Icon: Clock,        label: "Pending" },
    submitted: { cls: "bg-success-soft text-success border-success/20",     Icon: ShieldCheck,  label: "Submitted" },
    overdue:   { cls: "bg-danger-soft text-danger border-danger/30",        Icon: AlertCircle,  label: "Overdue" },
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

export function BandChip({ rate }: { rate: number }) {
  const cls = (() => {
    switch (rate) {
      case 0:  return "bg-secondary text-muted-foreground border-border";
      case 15: return "bg-accent-soft text-accent border-accent/30";
      case 18: return "bg-accent/15 text-accent border-accent/40";
      case 21: return "bg-accent text-accent-foreground border-accent";
      case 23: return "bg-[hsl(262_83%_58%/0.15)] text-[hsl(262_83%_45%)] border-[hsl(262_83%_58%/0.3)]";
      case 25: return "bg-danger-soft text-danger border-danger/30";
      default: return "bg-secondary text-muted-foreground border-border";
    }
  })();
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold", cls)}>
      {rate}%
    </span>
  );
}

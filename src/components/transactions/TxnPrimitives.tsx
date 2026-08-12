import { ReactNode } from "react";
import { LucideIcon, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiSpec {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
}

export function TxnKpi({ label, value, sublabel, icon: Icon, tone = "primary" }: KpiSpec) {
  const tones: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    danger: "bg-danger/12 text-danger",
  };
  return (
    <div className="cl-card p-4 border border-border">
      <div className="flex items-center gap-3">
        <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground truncate">
            {label}
          </p>
          <p className="mono text-lg font-semibold text-foreground mt-0.5 truncate text-left">
            {value}
          </p>
          {sublabel && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TxnToolbar({
  placeholder, value, onChange, ctaLabel, onCta,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  ctaLabel: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 rounded-xl border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <button
        onClick={onCta}
        className="h-11 inline-flex items-center gap-2 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        {ctaLabel}
      </button>
    </div>
  );
}

export function TxnPageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

export function YesNoBadge({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
        value ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

export function CategoryChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/12 text-primary whitespace-nowrap">
      {label}
    </span>
  );
}

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone =
  | "primary" | "success" | "warning" | "danger"
  | "skyblue" | "purple" | "muted";

const TONE_BG: Record<KpiTone, string> = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger:  "bg-danger/15 text-danger",
  skyblue: "bg-sky-100 text-sky-700",
  purple:  "bg-purple-100 text-purple-700",
  muted:   "bg-muted text-muted-foreground",
};

export const TONE_VALUE_TEXT: Record<KpiTone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger:  "text-danger",
  skyblue: "text-sky-700",
  purple:  "text-purple-700",
  muted:   "text-foreground",
};

export interface ReportKpiProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiTone;
}

export function ReportKpi({ label, value, hint, icon: Icon, tone = "primary" }: ReportKpiProps) {
  return (
    <div className="cl-card p-4 border border-border">
      <div className="flex items-start gap-3">
        <span className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", TONE_BG[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground truncate">
            {label}
          </p>
          <p className={cn("mono text-lg font-semibold mt-0.5 truncate text-left", TONE_VALUE_TEXT[tone])}>
            {value}
          </p>
          {hint && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function ReportKpiStrip({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>;
}

export function PageCard({
  title, action, children, className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("cl-card border border-border p-5", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          {title && <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatementRow({
  label, value, indent = 0, bold, total, negative, muted, large,
}: {
  label: ReactNode;
  value: ReactNode;
  indent?: number;
  bold?: boolean;
  total?: boolean;
  negative?: boolean;
  muted?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        total && "border-t border-border-strong mt-1 pt-2",
        large && "py-2",
      )}
      style={{ paddingLeft: indent * 16 }}
    >
      <span className={cn(
        "text-[13px]",
        muted ? "text-muted-foreground" : "text-foreground",
        bold && "font-semibold",
        large && "text-[15px] font-semibold",
      )}>
        {label}
      </span>
      <span className={cn(
        "mono text-[13px] tabular-nums",
        bold && "font-semibold",
        large && "text-[16px] font-semibold",
        negative && "text-danger",
      )}>
        {value}
      </span>
    </div>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider font-semibold text-primary mt-3 mb-1">
      {children}
    </div>
  );
}

export function Tag({
  tone = "primary", children,
}: { tone?: KpiTone; children: ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
      TONE_BG[tone],
    )}>
      {children}
    </span>
  );
}

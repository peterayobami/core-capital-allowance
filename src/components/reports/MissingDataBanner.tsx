import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface MissingItem {
  /** Field/value name that is missing. */
  field: string;
  /** Where to set it (e.g. "Opening Balances"). */
  section?: string;
}

export function MissingDataBanner({
  items,
  ctaLabel = "Configure in Organisation Settings → Opening Balances",
  ctaHref = "/settings/org/opening-balances",
}: {
  items: MissingItem[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className="rounded-lg p-4 flex items-start gap-3"
      style={{
        background: "hsl(var(--warning) / 0.1)",
        borderLeft: "4px solid hsl(var(--warning))",
      }}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--warning))" }} />
      <div className="flex-1 min-w-0">
        {items.length === 1 ? (
          <p className="text-[13px] text-foreground">
            <span className="font-semibold">{items[0].field}</span> has not been set.
            {items[0].section && (
              <span className="text-muted-foreground"> Required for accurate {items[0].section}.</span>
            )}
          </p>
        ) : (
          <>
            <p className="text-[13px] font-semibold text-foreground">
              Some configuration is missing — the statement below may be inaccurate.
            </p>
            <ul className="mt-1.5 ml-4 list-disc text-[12.5px] text-foreground space-y-0.5">
              {items.map((it, i) => (
                <li key={i}>{it.field}</li>
              ))}
            </ul>
          </>
        )}
        <Link
          to={ctaHref}
          className="inline-flex items-center gap-1 mt-2 text-[12.5px] font-medium hover:underline"
          style={{ color: "hsl(var(--warning))" }}
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function BalanceBanner({
  balanced,
  imbalance,
  message,
}: {
  balanced: boolean;
  imbalance: number;
  message: string;
}) {
  if (balanced) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-success/12 text-success">
        ✓ {message}
      </div>
    );
  }
  return (
    <div
      className="rounded-lg p-4 flex items-start gap-3"
      style={{
        background: "hsl(var(--danger) / 0.08)",
        borderLeft: "4px solid hsl(var(--danger))",
      }}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-danger" />
      <div className="text-[13px] text-foreground">
        <p>
          <span className="font-semibold text-danger">⛔ {message}</span>
        </p>
        <p className="text-[12.5px] text-muted-foreground mt-1">
          Difference:{" "}
          <span className="mono font-semibold text-danger">
            ₦{Math.abs(imbalance).toLocaleString("en-NG")}
          </span>
          . This indicates a missing or incorrect journal entry. Review the Trial Balance and
          posted journals before relying on this statement.
        </p>
      </div>
    </div>
  );
}

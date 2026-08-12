import { CALayout } from "@/components/ca/CALayout";
import { StatusBadge } from "@/components/ca/StatusBadge";
import { Button } from "@/components/ui/button";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import { caRepository } from "@/lib/repositories/ca.repository";
import {
  CLASSIFICATIONS,
} from "@/lib/mock-data/ca";
import { formatNGN, formatPct, totalAA, totalAdditions, totalPoolCost, totalTwdvBf, totalTwdvCf } from "@/lib/services/ca.service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, FileText, FileSpreadsheet, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMN_TIPS: Record<string, string> = {
  "TWDV B/F": "The remaining un-depreciated cost of assets in this class from the previous fiscal year.",
  "Additions": "The cost of new assets acquired in this class during the basis period.",
  "Pool Cost": "The cumulative original cost of all assets ever acquired in this classification. Used to calculate the 1% retention floor.",
  "Annual Allowance": "The tax-deductible capital allowance for the year, computed as AA Rate × (TWDV B/F + Additions).",
  "1% Retention Floor": "Under NTA 2025, a minimum of 1% of cumulative pool cost must be retained in TWDV until disposal.",
  "TWDV C/F": "The remaining pool value carried into the next fiscal year, never falling below the 1% retention floor.",
};

function HeaderTip({ label }: { label: string }) {
  const tip = COLUMN_TIPS[label];
  if (!tip) return <>{label}</>;
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3 w-3 opacity-60 hover:opacity-100" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
      </Tooltip>
    </span>
  );
}

export default function SchedulePage() {
  const { fiscalYear } = useFiscalYearStore();
  const year = caRepository.getByFiscalYear(fiscalYear);
  if (!year) return <CALayout breadcrumbs={["Taxation", "Capital Allowance", "Schedule"]}>No data</CALayout>;

  const aaTotal = totalAA(year);
  const totalCAAvailable = year.unrecoupedBf + aaTotal;

  return (
    <CALayout breadcrumbs={["Taxation", "Capital Allowance", "Schedule"]}>
      <TooltipProvider delayDuration={150}>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capital Allowance Computation</div>
            <h1 className="text-xl font-semibold mt-1">Year of Assessment: AY {year.assessmentYear}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Basis Period: 01 Jan {year.fiscalYear} – 31 Dec {year.fiscalYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={year.status} size="md" />
            {year.status === "locked" && year.lockedAt && (
              <span className="text-[11px] text-muted-foreground">
                Locked on {new Date(year.lockedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} by {year.lockedBy}
              </span>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1.5" /> Export to PDF</Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Export to Excel</Button>
          <div className="flex-1" />
          {year.status === "computed" && (
            <Button className="bg-success text-success-foreground hover:bg-success/90" size="sm">
              <Lock className="h-3.5 w-3.5 mr-1.5" /> Lock Schedule
            </Button>
          )}
          {year.status === "locked" && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft text-success px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Schedule Locked
            </span>
          )}
        </div>

        {/* Main Schedule Table */}
        <div className="data-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-center px-3 py-2.5 w-10">S/N</th>
                  <th className="text-left px-3 py-2.5">Asset Classification</th>
                  <th className="text-center px-3 py-2.5">Useful Life</th>
                  <th className="text-center px-3 py-2.5">AA Rate</th>
                  <th className="text-right px-3 py-2.5"><HeaderTip label="TWDV B/F" /> (₦)</th>
                  <th className="text-right px-3 py-2.5"><HeaderTip label="Additions" /> (₦)</th>
                  <th className="text-right px-3 py-2.5"><HeaderTip label="Pool Cost" /> (₦)</th>
                  <th className="text-right px-3 py-2.5"><HeaderTip label="Annual Allowance" /> (₦)</th>
                  <th className="text-right px-3 py-2.5"><HeaderTip label="1% Retention Floor" /> (₦)</th>
                  <th className="text-right px-3 py-2.5"><HeaderTip label="TWDV C/F" /> (₦)</th>
                </tr>
              </thead>
              <tbody>
                {year.rows.map((r, i) => {
                  const c = CLASSIFICATIONS.find((x) => x.id === r.classificationId)!;
                  const muted = c.aaRate === 0;
                  const floorBinding = !muted && r.twdvCf === r.retentionFloor;
                  return (
                    <Tooltip key={r.classificationId}>
                      <TooltipTrigger asChild>
                        <tr className={cn(muted && "text-muted-foreground/70")}>
                          <td className="text-center px-3 py-2.5 font-mono text-xs">{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium">{c.name}</td>
                          <td className="text-center px-3 py-2.5">
                            <span className="inline-flex rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium">
                              {c.usefulLife ? `${c.usefulLife} yrs` : "N/A"}
                            </span>
                          </td>
                          <td className="text-center px-3 py-2.5 font-mono text-xs">{formatPct(c.aaRate)}</td>
                          <td className="fig px-3 py-2.5">{formatNGN(r.twdvBf)}</td>
                          <td className="fig px-3 py-2.5">{formatNGN(r.additions)}</td>
                          <td className="fig px-3 py-2.5">
                            {formatNGN(r.poolCost)}
                            <div className="text-[10px] text-muted-foreground/70">cumulative cost</div>
                          </td>
                          <td className="fig px-3 py-2.5 font-bold">{formatNGN(r.annualAllowance)}</td>
                          <td className={cn("fig px-3 py-2.5", floorBinding && "text-warning font-medium")}>
                            {formatNGN(r.retentionFloor)}
                          </td>
                          <td className="fig px-3 py-2.5 font-bold">{formatNGN(r.twdvCf)}</td>
                        </tr>
                      </TooltipTrigger>
                      {muted && (
                        <TooltipContent side="top" className="text-xs">
                          No annual allowance — 0% AA rate under NTA 2025.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-right font-semibold">TOTAL ANNUAL ALLOWANCE</td>
                  <td className="fig px-3 py-3">{formatNGN(totalTwdvBf(year))}</td>
                  <td className="fig px-3 py-3">{formatNGN(totalAdditions(year))}</td>
                  <td className="fig px-3 py-3">{formatNGN(totalPoolCost(year))}</td>
                  <td className="fig px-3 py-3 font-bold text-accent">{formatNGN(aaTotal)}</td>
                  <td className="fig px-3 py-3">{formatNGN(year.rows.reduce((s, r) => s + r.retentionFloor, 0))}</td>
                  <td className="fig px-3 py-3 font-bold">{formatNGN(totalTwdvCf(year))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* CA Summary */}
        <div className="data-card max-w-2xl">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Capital Allowance Summary</h3>
            <p className="text-[11px] text-muted-foreground">Carried into Tax Computation as relief available</p>
          </div>
          <div className="px-5 py-4 space-y-2">
            <Row label="Unrecouped CA Brought Forward" value={formatNGN(year.unrecoupedBf)} />
            <Row label={`Add: Annual Allowance (FY ${fiscalYear})`} value={formatNGN(aaTotal)} />
            <div className="border-t border-border-strong my-2" />
            <Row label="Total Capital Allowance Available" value={formatNGN(totalCAAvailable)} bold />
          </div>
        </div>
      </TooltipProvider>
    </CALayout>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1">
      <span className={cn("text-sm", bold && "font-semibold")}>{label}</span>
      <span className={cn("font-mono tabular-nums", bold && "font-bold text-base")}>{value}</span>
    </div>
  );
}

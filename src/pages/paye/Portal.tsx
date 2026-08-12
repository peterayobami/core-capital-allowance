import { useMemo, useState } from "react";
import { PAYELayout } from "@/components/paye/PAYELayout";
import { BandChip } from "@/components/paye/RunStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  EMPLOYEES, CURRENT_PERIOD, periodLong, periodShort, RUNS, MONTH_NAMES,
} from "@/lib/mock-data/paye";
import { payeRepository } from "@/lib/repositories/paye.repository";
import { computePaye, formatNGN, formatNGNCompact, formatPct } from "@/lib/services/paye.service";
import { Download, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PayePortal() {
  const eligible = EMPLOYEES.filter(e => e.profile.hasProfile);
  const [empId, setEmpId] = useState<string>(eligible[0].id);
  const employee = eligible.find(e => e.id === empId)!;

  const c = useMemo(() => computePaye(employee.profile), [employee]);
  const currentRun = payeRepository.getRunByPeriod(CURRENT_PERIOD)!;
  const myEntry = currentRun.entries.find(e => e.employeeId === employee.id);

  // YTD aggregation
  const ytd = useMemo(() => {
    const yearRuns = RUNS.filter(r => r.period.year === CURRENT_PERIOD.year);
    let gross = 0, paye = 0, net = 0;
    yearRuns.forEach(r => {
      const ent = r.entries.find(e => e.employeeId === employee.id);
      if (ent) {
        gross += ent.monthlyGross;
        paye += ent.monthlyPaye;
        net += ent.monthlyNet;
      }
    });
    const etr = gross > 0 ? (paye / gross) * 100 : 0;
    return { gross, paye, net, etr, months: yearRuns.length };
  }, [employee]);

  const monthlyBasic = Math.round(employee.profile.basic / 12);
  const monthlyHousing = Math.round(employee.profile.housing / 12);
  const monthlyTransport = Math.round(employee.profile.transport / 12);
  const monthlyOther = Math.round(employee.profile.other / 12);
  const monthlyGross = monthlyBasic + monthlyHousing + monthlyTransport + monthlyOther;
  const monthlyPension = Math.round(c.pension / 12);
  const monthlyNhf = Math.round(c.nhf / 12);
  const monthlyRentRelief = Math.round(c.rentRelief / 12);
  const monthlyPaye = c.monthlyPaye;
  const totalDeductions = monthlyPension + monthlyNhf + monthlyPaye;
  const netPay = monthlyGross - totalDeductions;

  // Tax band ladder for breakdown
  const bandRows = c.bandSplits.map(s => ({
    label: `${s.rate === 0 ? "First" : "Next"} ${formatNGN(s.income)} @ ${s.rate}%`,
    amount: s.tax,
  }));

  return (
    <PAYELayout breadcrumbs={["Taxation", "PAYE", "Employee Portal"]}>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Period: <span className="font-medium text-foreground">{periodLong(CURRENT_PERIOD)}</span></span>
        <span>·</span>
        <span>Company: <span className="font-medium text-foreground">Bechellente Ltd</span></span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Employee Self-Service</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your payslip, PAYE breakdown, and year-to-date summary.
          </p>
        </div>
        <Select value={empId} onValueChange={setEmpId}>
          <SelectTrigger className="h-9 w-[280px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eligible.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} — {periodShort(CURRENT_PERIOD)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Gross Salary" value={formatNGN(monthlyGross)} foot="Monthly" />
        <SummaryCard label="PAYE Deducted" value={formatNGN(monthlyPaye)} foot="This month" />
        <SummaryCard label="Net Pay" value={formatNGN(netPay)} foot="Take home" highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Payslip */}
        <section className="data-card overflow-hidden lg:col-span-7">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">{periodLong(CURRENT_PERIOD)} Payslip</h3>
            <p className="text-[11px] text-muted-foreground">Monthly earnings and deductions</p>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Earnings</div>
              <div className="space-y-1.5">
                <PayslipRow label="Basic Salary" value={formatNGN(monthlyBasic)} />
                <PayslipRow label="Housing Allowance" value={formatNGN(monthlyHousing)} />
                <PayslipRow label="Transport Allowance" value={formatNGN(monthlyTransport)} />
                <PayslipRow label="Other Allowances" value={formatNGN(monthlyOther)} />
                <div className="border-t border-border pt-1.5">
                  <PayslipRow label="Gross Income" value={formatNGN(monthlyGross)} bold />
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Deductions</div>
              <div className="space-y-1.5">
                <PayslipRow label="Pension (8%)" value={`-${formatNGN(monthlyPension)}`} dim />
                <PayslipRow label="NHF (2.5%)" value={`-${formatNGN(monthlyNhf)}`} dim />
                {monthlyRentRelief > 0 && (
                  <PayslipRow label="Rent Relief (credited)" value={`+${formatNGN(monthlyRentRelief)}`} dim />
                )}
                <PayslipRow label="PAYE Tax" value={`-${formatNGN(monthlyPaye)}`} dim />
                <div className="border-t border-border pt-1.5">
                  <PayslipRow label="Total Deductions" value={`-${formatNGN(totalDeductions)}`} bold />
                </div>
              </div>
            </div>

            <div className="rounded-md bg-accent-soft border border-accent/20 p-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-accent">Net Pay</span>
              <span className="font-mono text-xl font-bold tabular-nums text-accent">{formatNGN(netPay)}</span>
            </div>

            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-3.5 w-3.5 mr-2" /> Download Payslip PDF
            </Button>
          </div>
        </section>

        {/* NTA Tax breakdown */}
        <section className="data-card overflow-hidden lg:col-span-5">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">NTA 2025 Tax Breakdown</h3>
            <p className="text-[11px] text-muted-foreground">Your PAYE computation details</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Annual Chargeable Income</span>
              <span className="font-mono font-semibold tabular-nums">{formatNGN(c.chargeableAnnual)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Your Tax Band</span>
              <BandChip rate={c.isExempt ? 0 : c.highestBand} />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tax Computation</div>
              {bandRows.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">Below taxable threshold (₦800k).</div>
              ) : (
                bandRows.map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/80">{row.label}</span>
                    <span className="font-mono tabular-nums">{formatNGN(row.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/60">
                <span className="font-medium">Annual PAYE</span>
                <span className="font-mono font-semibold tabular-nums">{formatNGN(c.annualPaye)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Monthly PAYE</span>
                <span className="font-mono font-semibold tabular-nums">{formatNGN(c.monthlyPaye)}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Your Reliefs Applied</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">Pension Contribution (8%)</span>
                <span className="font-mono tabular-nums">{formatNGN(c.pension)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">NHF Contribution (2.5%)</span>
                <span className="font-mono tabular-nums">{formatNGN(c.nhf)}</span>
              </div>
              {c.rentRelief > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/80">Rent Relief (20% of rent)</span>
                  <span className="font-mono tabular-nums">{formatNGN(c.rentRelief)}</span>
                </div>
              )}
            </div>

            {c.rentRelief > 0 && (
              <div className="rounded-md bg-success-soft border border-success/30 p-2.5 text-[11px] text-success flex items-start gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Rent receipt on file: Valid until Dec {CURRENT_PERIOD.year}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* YTD Summary */}
      <section className="data-card p-5">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold">Year-to-Date Summary</h3>
            <p className="text-[11px] text-muted-foreground">
              {MONTH_NAMES[0]} – {MONTH_NAMES[CURRENT_PERIOD.month - 1]} {CURRENT_PERIOD.year}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <YtdItem label="Total Gross Earned" value={formatNGN(ytd.gross)} />
          <YtdItem label="Total PAYE Paid" value={formatNGN(ytd.paye)} />
          <YtdItem label="Total Net Pay" value={formatNGN(ytd.net)} />
          <YtdItem label="Effective Tax Rate" value={formatPct(ytd.etr)} />
        </div>
      </section>
    </PAYELayout>
  );
}

function SummaryCard({ label, value, foot, highlight }: { label: string; value: string; foot: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "data-card p-5",
      highlight && "border-accent/30 bg-accent-soft/40",
    )}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={cn(
        "font-mono text-2xl font-semibold mt-2 tabular-nums",
        highlight && "text-accent",
      )}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{foot}</div>
    </div>
  );
}

function PayslipRow({ label, value, dim, bold }: { label: string; value: string; dim?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-foreground/85", dim && "text-muted-foreground")}>{label}</span>
      <span className={cn("font-mono tabular-nums", bold && "font-semibold", dim && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

function YtdItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}

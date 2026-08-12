import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageCard, StatementRow } from "@/components/reports/ReportPrimitives";
import { YearSelect } from "@/components/reports/PeriodFilter";
import {
  defaultYear, revenuesIn, purchasesIn, expensesIn,
  depreciationAddbackFor, computeTax,
} from "@/lib/services/tax.service";
import { formatNGN } from "@/lib/utils/format";
import {
  AlertTriangle, ArrowRight, Calculator, FileSpreadsheet,
  FileText, Info, Lock, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NEG = (n: number) => `(${formatNGN(Math.abs(n))})`;

export default function IncomeTaxesPage() {
  const [year, setYear] = useState<number>(defaultYear());
  const [caStatus, setCaStatus] = useState<"pending" | "locked">("pending");

  // Editable inputs
  const [unrecoupedCABF, setUnrecoupedCABF] = useState(0);
  const [annualAllowance, setAnnualAllowance] = useState(0);
  const [balancingAllowance, setBalancingAllowance] = useState(0);
  const [balancingCharge, setBalancingCharge] = useState(0);

  const data = useMemo(() => {
    const totalRevenue = revenuesIn(year).reduce((s, r) => s + r.sales, 0);
    const totalPurchases = purchasesIn(year).reduce((s, p) => s + p.cost, 0);
    const totalExpenses = expensesIn(year).reduce((s, e) => s + e.cost, 0);
    const depreciationAddback = depreciationAddbackFor(year);
    const t = computeTax({
      grossIncome: totalRevenue,
      costOfSales: totalPurchases,
      expenses: totalExpenses,
      depreciationAddback,
      unrecoupedCABF,
      annualAllowance,
      balancingAllowance,
      balancingCharge,
    });
    return { totalRevenue, totalPurchases, totalExpenses, depreciationAddback, ...t };
  }, [year, unrecoupedCABF, annualAllowance, balancingAllowance, balancingCharge]);

  const isPreview = caStatus !== "locked";
  const assessmentYear = year + 1;

  return (
    <AppShell title="Company Tax">
      <TooltipProvider delayDuration={150}>
        <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">

          {/* Page heading */}
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Company Tax
              </div>
              <h1 className="text-xl font-semibold mt-1">
                Year of Assessment: AY {assessmentYear}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Basis Period: 01 Jan {year} – 31 Dec {year}
              </p>
            </div>
            <YearSelect value={year} onChange={setYear} />
          </header>

          {/* CA Schedule gate */}
          {isPreview ? (
            <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-4">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold">CA Schedule Lock Required</div>
                <p className="text-[13px] text-foreground/80 mt-1">
                  The Capital Allowance Schedule for FY {year} must be locked before computing the tax liability.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setCaStatus("locked")}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" /> Lock CA Schedule
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-[13px] text-success">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold">CA Schedule Locked — FY {year}</span>
              <button
                className="ml-auto text-[12px] text-muted-foreground hover:underline"
                onClick={() => setCaStatus("pending")}
              >Reset</button>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── LEFT: Sections A–D ── */}
            <div className="xl:col-span-2 space-y-6">

              {/* Section A — Adjusted Profit */}
              <Section title="A · Adjusted Profit Computation" subtitle="Statutory adjustment of accounting profit">
                <Line label="Gross Income (Revenue)" value={formatNGN(data.totalRevenue)} />
                <Line label="Less: Cost of Sales (Purchases)" value={NEG(data.totalPurchases)} negative />
                <Line label="Less: Tax-Deductible Expenses" value={NEG(data.totalExpenses)} negative />
                <Line label="Add: Depreciation Add-back" value={formatNGN(data.depreciationAddback)} />
                <Divider />
                <Line label="ADJUSTED PROFIT" value={formatNGN(data.adjustedProfit)} bold large />
              </Section>

              {/* Section B — Capital Allowance Relief */}
              <Section title="B · Capital Allowance Relief" subtitle="Application of CA against adjusted profit">
                <EditableLine label="Unrecouped CA Brought Forward" value={unrecoupedCABF} onChange={setUnrecoupedCABF} />
                <EditableLine
                  label={`Add: Annual Allowance (FY ${year})`}
                  value={annualAllowance} onChange={setAnnualAllowance}
                />

                <EditableLine
                  label="Add: Balancing Allowance"
                  info="Arises when an asset is disposed for less than its TWDV. The shortfall is an additional CA deduction."
                  value={balancingAllowance} onChange={setBalancingAllowance}
                />
                <EditableLine
                  label="Less: Balancing Charge"
                  info="Arises when an asset is disposed for more than its TWDV. The excess is added back as taxable income."
                  value={balancingCharge} onChange={setBalancingCharge}
                  danger
                />

                <Divider />
                <Line label="Total Capital Allowance Available" value={formatNGN(data.totalCAAvailable)} bold />
                <Line
                  label="Less: CA Relieved (limited to Adjusted Profit)"
                  value={NEG(data.caRelieved)}
                  negative
                  info="Under NTA 2025, the previous 2/3-of-assessable-profit restriction has been abolished. The full adjusted profit is available for CA relief."
                />
                <Divider />
                <Line label={`Unrecouped CA Carried Forward to FY ${year + 1}`} value={formatNGN(data.unrecoupedCF)} bold />
              </Section>

              {/* Section C — Tax Liability */}
              <Section title="C · Tax Liability" subtitle="Application of CIT band rate">
                <Line label="Assessable Income" value={formatNGN(data.assessableIncome)} />
                <Divider />
                <div className="rounded-md bg-primary/5 border border-primary/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold">
                      Company Income Tax @ {data.citRate}%
                    </span>
                    <span className="mono text-xl font-bold tabular-nums">
                      {formatNGN(data.citPayable)}
                    </span>
                  </div>
                </div>
                {data.citPayable === 0 && (
                  <div className="flex items-center gap-2 rounded-md bg-success/10 border border-success/20 px-3 py-2 text-[12px] text-success mt-2">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    Capital Allowance fully covers the adjusted profit — no CIT payable.
                  </div>
                )}

                {/* CIT Rate Determination */}
                <div className="mt-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">CIT Rate Determination</h3>
                    <span className="text-[10px] text-muted-foreground">CITA 3rd Schedule · NTA 2025</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <Field label="Gross Income" value={formatNGN(data.totalRevenue)} mono />
                    <Field label="Band Applied" value={`${data.band} Company`} />
                    <Field label="Rate" value={`${data.citRate}%`} mono accent />
                  </div>
                  <div className="mt-4 grid grid-cols-3 rounded-md border border-border overflow-hidden text-[11px]">
                    <BandCell active={data.band === "Small"}  label="≤ ₦25M"      rate="0%" />
                    <BandCell active={data.band === "Medium"} label="≤ ₦100M"     rate="20%" />
                    <BandCell active={data.band === "Large"}  label="Above ₦100M" rate="30%" />
                  </div>
                </div>
              </Section>

              {/* Section D — Development Levy */}
              <Section title="D · Development Levy / Minimum Tax" subtitle="Applies regardless of profit position — CITA s.33">
                <Line label="Gross Turnover (Revenue)" value={formatNGN(data.totalRevenue)} />
                <Line label="Minimum Tax Rate" value="0.5%" />
                <Divider />
                <Line label="DEVELOPMENT LEVY PAYABLE" value={formatNGN(data.developmentLevy)} bold large />
                <div className="mt-3 rounded-md bg-primary/5 border border-primary/15 px-3 py-2.5 text-[12px] text-foreground/80 leading-relaxed">
                  <Info className="h-3.5 w-3.5 inline mr-1.5 shrink-0 align-middle text-primary" />
                  The Development Levy is charged at <strong>0.5%</strong> of gross turnover and applies even when the company
                  has no taxable profit or when CIT is zero due to capital allowance relief. It is not deductible for future CIT purposes.
                </div>
              </Section>

              {/* Bottom action bar */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={() => toast.success("Tax liability recomputed")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Calculator className="h-4 w-4 mr-2" /> Compute Tax Liability
                </Button>
                <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
                  <FileText className="h-4 w-4 mr-2" /> Export Computation
                </Button>
              </div>
            </div>

            {/* ── RIGHT: Tax Summary sidebar ── */}
            <aside className="xl:col-span-1">
              <div className="cl-card border border-border p-5 xl:sticky xl:top-20">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tax Summary — AY {assessmentYear}
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">Live computation snapshot</div>

                <div className="mt-4 space-y-2.5 text-sm">
                  <SummaryRow label="Fiscal Year" value={`FY ${year}`} mono />
                  <SummaryRow label="Assessment Year" value={`AY ${assessmentYear}`} mono />
                  <SummaryRow label="Basis Period" value={`01 Jan – 31 Dec ${year}`} />
                  <div className="h-px bg-border" />
                  <SummaryRow label="Adjusted Profit" value={formatNGN(data.adjustedProfit)} />
                  <SummaryRow label="CA Relief Utilised" value={formatNGN(data.caRelieved)} />
                  <SummaryRow label="CA Remaining (C/F)" value={formatNGN(data.unrecoupedCF)} />
                  <SummaryRow label="Assessable Income" value={formatNGN(data.assessableIncome)} />
                  <div className="h-px bg-border" />

                  <div>
                    <div className="text-xs text-muted-foreground">CIT Payable</div>
                    <div className="mono text-2xl font-bold mt-0.5 tabular-nums text-primary">
                      {formatNGN(data.citPayable)}
                    </div>
                    {data.citPayable === 0 && (
                      <span className="inline-flex items-center gap-1 mt-1.5 rounded-full bg-success/15 text-success px-2.5 py-0.5 text-[11px] font-semibold">
                        <ShieldCheck className="h-3 w-3" /> No CIT Payable
                      </span>
                    )}
                  </div>

                  <SummaryRow label="Development Levy" value={formatNGN(data.developmentLevy)} />
                  <div className="h-px bg-border-strong" />

                  <div>
                    <div className="text-xs text-muted-foreground">Total Tax Payable</div>
                    <div className="mono text-3xl font-bold mt-0.5 tabular-nums">
                      {formatNGN(data.totalTaxPayable)}
                    </div>
                  </div>

                  <SummaryRow label="Effective Tax Rate" value={`${data.effectiveTaxRate.toFixed(2)}%`} mono />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("PDF export coming soon")}>
                    <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Excel export coming soon")}>
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
                  </Button>
                </div>
                <Button
                  className="w-full mt-3 bg-success text-success-foreground hover:bg-success/90"
                  size="sm"
                  disabled={isPreview}
                  onClick={() => toast.success("Company tax computation locked")}
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  {isPreview ? "Lock CA Schedule First" : "Lock Company Tax"}
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </TooltipProvider>
    </AppShell>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <PageCard className="!p-0 overflow-hidden">
      <div className="border-b border-border px-5 py-3 bg-secondary/40">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground/80 mt-0.5">{subtitle}</div>}
      </div>
      <div className="px-5 py-4 space-y-1">{children}</div>
    </PageCard>
  );
}

function Line({
  label, value, bold, large, negative, info,
}: {
  label: string; value: string; bold?: boolean; large?: boolean; negative?: boolean; info?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex items-center gap-1.5 text-sm">
        <span className={cn(bold && "font-semibold", large && "text-base")}>{label}</span>
        {info && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-primary cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{info}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className={cn(
        "mono tabular-nums text-sm",
        bold && "font-bold",
        large && "text-lg",
        negative && "text-danger",
      )}>
        {value}
      </span>
    </div>
  );
}

function EditableLine({
  label, value, onChange, info, danger,
}: {
  label: string; value: number; onChange: (n: number) => void; info?: string; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex items-center gap-1.5 text-sm">
        <span>{label}</span>
        {info && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-primary cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{info}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <input
        type="number"
        min={0}
        value={value || ""}
        placeholder="₦0.00"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={cn(
          "mono w-44 text-right bg-transparent border-0 border-b border-border focus:outline-none text-sm py-0.5",
          danger ? "focus:border-danger text-danger" : "focus:border-primary",
        )}
      />
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border-strong my-1" />;
}

function Field({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-semibold", mono && "mono", accent && "text-primary text-lg")}>
        {value}
      </div>
    </div>
  );
}

function BandCell({ active, label, rate }: { active: boolean; label: string; rate: string }) {
  return (
    <div className={cn(
      "px-3 py-2 text-center border-r last:border-r-0 border-border",
      active ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground",
    )}>
      <div className="font-medium">{label}</div>
      <div className={cn("mono text-[10px] mt-0.5", active ? "opacity-90" : "opacity-70")}>{rate}</div>
    </div>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", mono && "mono")}>{value}</span>
    </div>
  );
}

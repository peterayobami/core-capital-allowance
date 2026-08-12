import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import { caRepository } from "@/lib/repositories/ca.repository";
import { formatNGN, taxComputation, totalAA } from "@/lib/services/ca.service";
import { AlertTriangle, ArrowRight, Calculator, FileSpreadsheet, FileText, Info, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function TaxComputation() {
  const { fiscalYear } = useFiscalYearStore();
  const year = caRepository.getByFiscalYear(fiscalYear);

  return (
    <AppShell title="Tax Computation">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tax Computation</div>
            <h1 className="text-xl font-semibold mt-1">Year of Assessment: AY {year?.assessmentYear}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Basis Period: 01 Jan {year?.fiscalYear} – 31 Dec {year?.fiscalYear}
            </p>
          </div>
        </div>

        {!year ? (
          <div className="data-card p-6">No data for FY {fiscalYear}</div>
        ) : year.status !== "locked" ? (
          <PrerequisiteWarning fiscalYear={fiscalYear} />
        ) : (
          <ComputationView year={year} />
        )}

        {year && year.status === "computed" && (
          <ComputationView year={year} preview />
        )}
      </div>
    </AppShell>
  );
}

function PrerequisiteWarning({ fiscalYear }: { fiscalYear: number }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-4">
      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">CA Schedule Lock Required</div>
        <p className="text-[13px] text-foreground/80 mt-1">
          The Capital Allowance Schedule for FY {fiscalYear} must be locked before computing the tax liability.
        </p>
      </div>
      <Button size="sm" className="bg-warning text-warning-foreground hover:bg-warning/90">
        <Lock className="h-3.5 w-3.5 mr-1.5" /> Lock CA Schedule
        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
      </Button>
    </div>
  );
}

function ComputationView({ year, preview }: { year: NonNullable<ReturnType<typeof caRepository.getByFiscalYear>>; preview?: boolean }) {
  const t = taxComputation(year);
  const aa = totalAA(year);

  return (
    <TooltipProvider delayDuration={150}>
      {preview && (
        <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3">
          <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="text-[13px] text-foreground/80">
            <strong>Preview:</strong> CA schedule is computed but not yet locked. The figures below will be official once you lock the CA schedule.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Waterfall */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section A */}
          <Section title="A · Adjusted Profit Computation" subtitle="Statutory adjustment of accounting profit">
            <Line label="Gross Income (Revenue)" value={formatNGN(year.grossIncome)} />
            <Line label="Less: Cost of Sales (Purchases)" value={formatNGN(-year.costOfSales)} negative />
            <Line label="Less: Tax-Deductible Expenses" value={formatNGN(-year.expenses)} negative />
            <Line label="Add: Depreciation Add-back" value={formatNGN(year.depreciationAddback)} />
            <Divider />
            <Line label="ADJUSTED PROFIT" value={formatNGN(t.adjustedProfit)} bold large />
          </Section>

          {/* Section B */}
          <Section title="B · Capital Allowance Relief" subtitle="Application of CA against adjusted profit">
            <Line label="Unrecouped CA Brought Forward" value={formatNGN(year.unrecoupedBf)} />
            <Line label={`Add: Annual Allowance (FY ${year.fiscalYear})`} value={formatNGN(aa)} />
            <Divider />
            <Line label="Total Capital Allowance Available" value={formatNGN(t.totalCAAvailable)} bold />
            <Line
              label="Less: CA Relieved (limited to Adjusted Profit)"
              value={formatNGN(-t.caRelieved)}
              negative
              info="Under NTA 2025, the previous 2/3-of-assessable-profit restriction has been abolished. The full adjusted profit is available for CA relief."
            />
            <Divider />
            <Line label={`Unrecouped CA Carried Forward to FY ${year.fiscalYear + 1}`} value={formatNGN(t.unrecoupedCf)} bold />
          </Section>

          {/* Section C */}
          <Section title="C · Tax Liability" subtitle="Application of CIT band rate">
            <Line label="Assessable Income" value={formatNGN(t.assessableIncome)} />
            <Divider />
            <div className="rounded-md bg-primary/5 border border-primary/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold">Company Income Tax @ {t.citRate}%</span>
                <span className="font-mono text-xl font-bold tabular-nums">{formatNGN(t.citPayable)}</span>
              </div>
            </div>
          </Section>

          {/* CIT Rate Determination */}
          <div className="data-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">CIT Rate Determination</h3>
              <span className="text-[10px] text-muted-foreground">CITA 3rd Schedule · NTA 2025</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Gross Income" value={formatNGN(year.grossIncome)} mono />
              <Field label="Band Applied" value={`${t.band} Company`} />
              <Field label="Rate" value={`${t.citRate}%`} mono accent />
            </div>
            <div className="mt-4 grid grid-cols-3 rounded-md border border-border overflow-hidden text-[11px]">
              <BandCell active={t.band === "Small"} label="≤ ₦25M" rate="0%" />
              <BandCell active={t.band === "Medium"} label="≤ ₦100M" rate="20%" />
              <BandCell active={t.band === "Large"} label="Above ₦100M" rate="30%" />
            </div>
          </div>
        </div>

        {/* Right: Tax Summary card */}
        <aside className="xl:col-span-1 space-y-4">
          <div className="data-card p-5 sticky top-20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tax Summary — AY {year.assessmentYear}
            </div>
            <div className="mt-4 space-y-4">
              <SummaryRow label="Assessable Income" value={formatNGN(t.assessableIncome)} />
              <div>
                <div className="text-xs text-muted-foreground">CIT Payable</div>
                <div className="font-mono text-2xl font-bold mt-1 tabular-nums">{formatNGN(t.citPayable)}</div>
                {t.citPayable === 0 && (
                  <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-success-soft text-success px-2.5 py-0.5 text-[11px] font-semibold">
                    <ShieldCheck className="h-3 w-3" /> No Tax Payable
                  </span>
                )}
              </div>
              <div className="h-px bg-border" />
              <SummaryRow label="Effective Tax Rate" value={`${t.effectiveTaxRate.toFixed(2)}%`} mono />
              <SummaryRow label="CA Relief Utilised" value={formatNGN(t.caRelieved)} />
              <SummaryRow label="CA Remaining (C/F)" value={formatNGN(t.unrecoupedCf)} />
              {t.assessableIncome === 0 && (
                <div className="rounded-md bg-success-soft border border-success/20 p-3 text-[12px] text-success">
                  Capital Allowance fully covers the adjusted profit.
                </div>
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> PDF</Button>
              <Button variant="outline" size="sm"><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel</Button>
            </div>
            <Button className="w-full mt-3 bg-success text-success-foreground hover:bg-success/90" size="sm">
              <Lock className="h-3.5 w-3.5 mr-1.5" /> Lock Tax Computation
            </Button>
          </div>
        </aside>
      </div>

      <div className="flex items-center gap-2">
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Calculator className="h-4 w-4 mr-2" /> Compute Tax Liability
        </Button>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" /> Export Computation
        </Button>
      </div>
    </TooltipProvider>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="data-card overflow-hidden">
      <div className="border-b border-border px-5 py-3 bg-secondary/40">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground/80 mt-0.5">{subtitle}</div>}
      </div>
      <div className="px-5 py-4 space-y-2">{children}</div>
    </div>
  );
}

function Line({ label, value, bold, large, negative, info }: {
  label: string; value: string; bold?: boolean; large?: boolean; negative?: boolean; info?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex items-center gap-1.5 text-sm">
        <span className={cn(bold && "font-semibold", large && "text-base")}>{label}</span>
        {info && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-accent cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{info}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className={cn(
        "font-mono tabular-nums text-sm",
        bold && "font-bold",
        large && "text-lg",
        negative && "text-danger",
      )}>
        {value}
      </span>
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
      <div className={cn("mt-1 font-semibold", mono && "font-mono", accent && "text-accent text-lg")}>{value}</div>
    </div>
  );
}

function BandCell({ active, label, rate }: { active: boolean; label: string; rate: string }) {
  return (
    <div className={cn(
      "px-3 py-2 text-center border-r last:border-r-0 border-border",
      active ? "bg-accent text-accent-foreground" : "bg-secondary/30 text-muted-foreground",
    )}>
      <div className="font-medium">{label}</div>
      <div className={cn("font-mono text-[10px] mt-0.5", active ? "opacity-90" : "opacity-70")}>{rate}</div>
    </div>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", mono && "font-mono")}>{value}</span>
    </div>
  );
}

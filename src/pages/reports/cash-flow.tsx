import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import {
  ReportKpi, ReportKpiStrip, PageCard, StatementRow, SectionHeading,
} from "@/components/reports/ReportPrimitives";
import { MissingDataBanner, type MissingItem } from "@/components/reports/MissingDataBanner";
import { YearSelect } from "@/components/reports/PeriodFilter";
import { Button } from "@/components/ui/button";
import {
  Wallet, TrendingUp, TrendingDown, Printer, Info, ArrowRight,
  Briefcase, Banknote, Sigma,
} from "lucide-react";
import { computeCashFlow } from "@/lib/services/ledger.service";
import type { CFInputs } from "@/lib/models/ledger";
import { defaultYear, aggregateMonthly } from "@/lib/services/tax.service";
import { formatNGN } from "@/lib/utils/format";
import { selectOpeningBalance } from "@/stores/org-settings.store";
import { toast } from "sonner";
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Legend, Line, BarChart, Cell, LabelList, ReferenceLine,
} from "recharts";
import { abbr, MoneyTooltip } from "@/pages/taxation/Vat";

const FMT = (n: number) => n < 0 ? `(${formatNGN(Math.abs(n))})` : formatNGN(n);

export default function CashFlowPage() {
  const [year, setYear] = useState<number>(defaultYear());

  // 🔌 BACKEND: Opening cash and all financing/disposal flows must come
  // from posted ledger entries — never from inline inputs on the report.
  const ob = selectOpeningBalance(year);
  const inputs: CFInputs = {
    openingCash: ob.openingCash,
    disposalProceeds: 0,
    capitalIntroduced: 0,
    loanProceeds: 0,
    loanRepayment: 0,
    dividendsPaid: 0,
  };

  const cf = useMemo(() => computeCashFlow(year, inputs), [year, inputs]);
  const monthly = useMemo(() => aggregateMonthly(year), [year]);

  const op = cf.sections[0];
  const inv = cf.sections[1];
  const fin = cf.sections[2];
  const netPosition = op.subtotal + inv.subtotal + fin.subtotal;

  const missing: MissingItem[] = [];
  if (ob.openingCash === 0) {
    missing.push({ field: `Opening Cash for FY${year} has not been set.`,
      section: "Cash Flow Statement" });
  }

  // Monthly operating CF — proxy from revenue inflows vs (purchase+expense) outflows
  const opMonthly = monthly.map((m, i) => {
    const inflow = m.revenue;
    const outflow = m.purchases + m.expensesTotal;
    return { month: m.month, inflow, outflow, net: inflow - outflow };
  });
  let cum = 0;
  const opMonthlyCum = opMonthly.map(m => ({ ...m, cumulative: (cum += m.net) }));

  const summaryData = [
    { name: "Operating CF", value: op.subtotal,  color: "hsl(var(--success))" },
    { name: "Investing CF", value: inv.subtotal, color: "hsl(var(--warning))" },
    { name: "Financing CF", value: fin.subtotal, color: "hsl(var(--primary))" },
    { name: "Net Change",   value: netPosition,
      color: netPosition >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))" },
  ];

  return (
    <AppShell title="Cash Flow Statement">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reports</div>
            <h1 className="text-xl font-semibold mt-1">Cash Flow Statement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Indirect method — Operating, Investing, Financing for FY {year}.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <YearSelect value={year} onChange={setYear} />
            <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
              <Printer className="h-4 w-4 mr-1.5" /> Export
            </Button>
          </div>
        </header>

        <ReportKpiStrip>
          <ReportKpi label="Operating Cash Flow" value={FMT(op.subtotal)}
            hint="From core operations"
            icon={op.subtotal >= 0 ? TrendingUp : TrendingDown}
            tone={op.subtotal >= 0 ? "success" : "danger"} />
          <ReportKpi label="Investing Cash Flow" value={FMT(inv.subtotal)}
            hint="Capex / disposals" icon={Briefcase} tone="primary" />
          <ReportKpi label="Financing Cash Flow" value={FMT(fin.subtotal)}
            hint="Equity, loans, dividends" icon={Banknote} tone="warning" />
          <ReportKpi label="Net Cash Position" value={FMT(netPosition)}
            hint="A + B + C"
            icon={Sigma}
            tone={netPosition >= 0 ? "success" : "danger"} />
        </ReportKpiStrip>

        {missing.length > 0 && <MissingDataBanner items={missing} />}

        {/* Two charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PageCard title="Monthly Operating Cash Flow">
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={opMonthlyCum} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left"  tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                  <RTooltip content={<MoneyTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="inflow"  name="Inflows"  fill="hsl(var(--success))" radius={[4,4,0,0]} />
                  <Bar yAxisId="left" dataKey="outflow" name="Outflows" fill="hsl(var(--warning))" radius={[4,4,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative Net"
                    stroke="hsl(var(--chart-violet))" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </PageCard>

          <PageCard title="Cash Flow Summary">
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={summaryData} layout="vertical" margin={{ top: 10, right: 60, left: 100, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <RTooltip content={<MoneyTooltip />} />
                  <ReferenceLine x={0} stroke="hsl(var(--border-strong))" />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {summaryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    <LabelList dataKey="value" position="right" formatter={(v: number) => abbr(v)} style={{ fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>
        </div>

        {/* Statement */}
        <PageCard title={`Statement of Cash Flows — FY ${year}`}>
          <div>
            <SectionHeading>Operating Activities</SectionHeading>
            {op.items.map((it, i) => (
              <StatementRow key={i} label={it.label} value={it.value === 0 ? "—" : FMT(it.value)}
                indent={1} negative={it.value < 0}
                muted={it.label.includes("Add:") || it.label.startsWith("(")} />
            ))}
            <StatementRow label="Net Cash from Operating Activities" value={FMT(op.subtotal)}
              total bold negative={op.subtotal < 0} />

            <SectionHeading>Investing Activities</SectionHeading>
            {inv.items.map((it, i) => (
              <StatementRow key={i} label={it.label} value={it.value === 0 ? "—" : FMT(it.value)}
                indent={1} negative={it.value < 0} />
            ))}
            <StatementRow label="Net Cash from Investing Activities" value={FMT(inv.subtotal)}
              total bold negative={inv.subtotal < 0} />

            <SectionHeading>Financing Activities</SectionHeading>
            {fin.items.map((it, i) => (
              <StatementRow key={i} label={it.label} value={it.value === 0 ? "—" : FMT(it.value)}
                indent={1} negative={it.value < 0} />
            ))}
            <StatementRow label="Net Cash from Financing Activities" value={FMT(fin.subtotal)}
              total bold negative={fin.subtotal < 0} />

            <div className="mt-3 p-3 rounded-md bg-secondary/50 border border-border text-[12px] text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <span>
                Financing activity figures are derived from journal entries posted to equity and
                liability accounts. To record a loan, dividend, or capital event,{" "}
                <Link to="/books/journals" className="text-primary font-medium hover:underline inline-flex items-center gap-0.5">
                  post a manual journal <ArrowRight className="h-3 w-3" />
                </Link>.
              </span>
            </div>

            <div className="mt-5 pt-4 border-t-2 border-border-strong space-y-1">
              <StatementRow label="Net Increase / (Decrease) in Cash"
                value={FMT(cf.netChange)} bold negative={cf.netChange < 0} />
              <StatementRow label="Cash & Cash Equivalents — Opening"
                value={ob.openingCash === 0 ? "—" : formatNGN(cf.openingCash)} muted />
              <StatementRow label="Cash & Cash Equivalents — Closing"
                value={formatNGN(cf.closingCash)} large />
            </div>
          </div>
        </PageCard>

        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Wallet className="h-3 w-3" />
          Opening cash sourced from Organisation Settings → Opening Balances.
        </p>
      </div>
    </AppShell>
  );
}

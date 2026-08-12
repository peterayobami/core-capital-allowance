import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportKpi, ReportKpiStrip, PageCard, StatementRow, SectionHeading }
  from "@/components/reports/ReportPrimitives";
import { MissingDataBanner, type MissingItem } from "@/components/reports/MissingDataBanner";
import { YearSelect } from "@/components/reports/PeriodFilter";
import {
  defaultYear, revenuesIn, purchasesIn, expensesIn,
  depreciationAddbackFor, computeTax, aggregateMonthly,
} from "@/lib/services/tax.service";
// 🔌 BACKEND: GET /api/capital-allowance/:year returns { unrecoupedBF, annualAllowance, twdv }.
// The P&L reads these values from the CA module — never as inline inputs.
import { selectOpeningBalance, selectUnrecoupedCABF } from "@/stores/org-settings.store";
import { formatNGN } from "@/lib/utils/format";
import {
  TrendingUp, BadgeDollarSign, Activity, Receipt, Info, Printer,
} from "lucide-react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Legend, Line, PieChart, Pie, Cell, LabelList,
} from "recharts";
import { abbr, MoneyTooltip } from "@/pages/taxation/Vat";

const NEG = (n: number) => `(${formatNGN(Math.abs(n))})`;

export default function ProfitAndLossPage() {
  const [year, setYear] = useState<number>(defaultYear());
  const [showWorkings, setShowWorkings] = useState(false);

  // 🔌 BACKEND: All brought-forward values are read from Organisation Settings
  // and the Capital Allowance module — never accepted as inline inputs here.
  const ob = selectOpeningBalance(year);
  const unrecoupedCABF = selectUnrecoupedCABF(year);
  const annualAllowance = 0; // 🔌 BACKEND: GET /api/capital-allowance/:year → annualAllowance
  const retainedEarningsBF = ob.retainedEarningsBF;

  const data = useMemo(() => {
    const revs = revenuesIn(year);
    const purs = purchasesIn(year);
    const exps = expensesIn(year);

    const totalRevenue = revs.reduce((s, r) => s + r.sales, 0);
    const totalPurchases = purs.reduce((s, p) => s + p.cost, 0);
    const totalExpenses = exps.reduce((s, e) => s + e.cost, 0);
    const grossProfit = totalRevenue - totalPurchases;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfitBeforeTax = grossProfit - totalExpenses;
    const netMarginPct = totalRevenue > 0 ? (netProfitBeforeTax / totalRevenue) * 100 : 0;
    const depreciationAddback = depreciationAddbackFor(year);

    const t = computeTax({
      grossIncome: totalRevenue,
      costOfSales: totalPurchases,
      expenses: totalExpenses,
      depreciationAddback,
      unrecoupedCABF,
      annualAllowance,
    });

    const netProfitAfterTax = netProfitBeforeTax - t.citPayable - t.developmentLevy;
    // 🔌 BACKEND: retainedEarningsCF is the closing Retained Earnings balance (account 3200).
    // The Balance Sheet reads this same figure from the trial balance — never recompute it
    // independently. Both pages share one source of truth: the posted ledger balance of 3200.
    const retainedEarningsCF = netProfitAfterTax + retainedEarningsBF;

    return {
      totalRevenue, totalPurchases, totalExpenses, grossProfit, grossMarginPct,
      netProfitBeforeTax, netMarginPct, depreciationAddback,
      ...t, netProfitAfterTax, retainedEarningsCF,
    };
  }, [year, unrecoupedCABF, annualAllowance, retainedEarningsBF]);

  const monthly = useMemo(() => aggregateMonthly(year), [year]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    expensesIn(year).forEach(e => map.set(e.category, (map.get(e.category) ?? 0) + e.cost));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [year]);
  const expenseTotal = expenseBreakdown.reduce((s, e) => s + e.value, 0);

  const waterfall = useMemo(() => [
    { label: "Revenue",            value: data.totalRevenue,         color: "hsl(var(--success))" },
    { label: "Cost of Sales",      value: -data.totalPurchases,      color: "hsl(var(--warning))" },
    { label: "Gross Profit",       value: data.grossProfit,          color: "hsl(var(--primary))" },
    { label: "Expenses",           value: -data.totalExpenses,       color: "hsl(var(--warning))" },
    { label: "Net Profit BT",      value: data.netProfitBeforeTax,   color: "hsl(var(--chart-violet))" },
    { label: "CIT",                value: -data.citPayable,          color: "hsl(var(--danger))" },
    { label: "Development Levy",   value: -data.developmentLevy,     color: "hsl(var(--danger))" },
    { label: "Net Profit AT",      value: data.netProfitAfterTax,
      color: data.netProfitAfterTax >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))" },
  ], [data]);

  const PIE = ["#184F97","#00A067","#F47727","#7B2CBF","#0EA5E9","#FC5A5A","#0F766E","#9333EA"];

  const missing: MissingItem[] = [];
  if (retainedEarningsBF === 0)
    missing.push({ field: `Retained Earnings (brought forward) for FY${year} is not set.` });

  return (
    <AppShell title="Profit and Loss">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reports</div>
            <h1 className="text-xl font-semibold mt-1">Profit and Loss</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              For the year ended 31 December {year}.
            </p>
          </div>
          <YearSelect value={year} onChange={setYear} />
        </header>

        <ReportKpiStrip>
          <ReportKpi label="Total Revenue" value={formatNGN(data.totalRevenue)} hint="Gross income for the period"
            icon={TrendingUp} tone="success" />
          <ReportKpi label="Gross Profit" value={formatNGN(data.grossProfit)}
            hint={`After CoS · ${data.grossMarginPct.toFixed(1)}% margin`} icon={BadgeDollarSign} tone="primary" />
          <ReportKpi label="Net Profit / (Loss)" value={formatNGN(Math.abs(data.netProfitBeforeTax))} hint="Before tax"
            icon={Activity} tone={data.netProfitBeforeTax >= 0 ? "warning" : "danger"} />
          <ReportKpi label="CIT Liability" value={formatNGN(data.citPayable)}
            hint={`${data.band} company · ${data.citRate}% rate`} icon={Receipt} tone="purple" />
        </ReportKpiStrip>

        {missing.length > 0 && <MissingDataBanner items={missing} />}

        {/* Revenue vs Expenses — full row */}
        <PageCard title="Revenue vs. Expenses (Monthly)">
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={monthly} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                <RTooltip content={<MoneyTooltip />} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--success))" radius={[4,4,0,0]} />
                <Bar dataKey="purchases" name="Cost of Sales" fill="hsl(var(--warning))" fillOpacity={0.8} radius={[4,4,0,0]} />
                <Bar dataKey="expensesTotal" name="Expenses" fill="hsl(var(--primary))" fillOpacity={0.7} radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="hsl(var(--chart-violet))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </PageCard>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <PageCard title="Profit Breakdown" className="lg:col-span-7">
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <BarChart data={waterfall} layout="vertical" margin={{ top: 10, right: 50, left: 100, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={100} />
                  <RTooltip content={<MoneyTooltip />} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {waterfall.map((w, i) => <Cell key={i} fill={w.color} />)}
                    <LabelList dataKey="value" position="right" formatter={(v: number) => abbr(v)} style={{ fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>

          <PageCard title="Expense Breakdown by Category" className="lg:col-span-3">
            <div style={{ width: "100%", height: 220 }} className="relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name"
                    innerRadius="58%" outerRadius="88%" paddingAngle={1}>
                    {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <RTooltip content={<MoneyTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="mono text-[14px] font-semibold">{formatNGN(expenseTotal)}</div>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 max-h-[120px] overflow-auto pr-1">
              {expenseBreakdown.map((e, i) => {
                const pct = expenseTotal > 0 ? (e.value / expenseTotal) * 100 : 0;
                return (
                  <div key={e.name} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: PIE[i % PIE.length] }} />
                      <span className="truncate">{e.name}</span>
                    </span>
                    <span className="mono text-muted-foreground text-[11px] shrink-0">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </PageCard>
        </div>

        {/* P&L statement */}
        <PageCard
          title="Profit and Loss Statement"
          action={
            <button onClick={() => toast.info("Print/PDF coming soon")}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-secondary">
              <Printer className="h-4 w-4" /> Print / Export PDF
            </button>
          }
        >
          <div className="text-center mb-3">
            <div className="text-[13px] font-semibold tracking-wider uppercase text-primary">Profit and Loss Statement</div>
            <div className="text-xs text-muted-foreground">For the year ended 31 December {year}</div>
          </div>

          <SectionHeading>Income</SectionHeading>
          <StatementRow label="Revenue from Operations" value={formatNGN(data.totalRevenue)} />

          <SectionHeading>Less: Cost of Sales</SectionHeading>
          <StatementRow label="Total Purchases" value={NEG(data.totalPurchases)} negative />
          <StatementRow label="Gross Profit" value={formatNGN(data.grossProfit)} large total />
          <StatementRow label="Gross Margin" value={`${data.grossMarginPct.toFixed(1)}%`} muted />

          <SectionHeading>Less: Operating Expenses</SectionHeading>
          <StatementRow label="Admin & Operational Expenses" value={NEG(data.totalExpenses)} negative />
          <StatementRow
            label="Net Profit / (Loss) Before Tax"
            value={data.netProfitBeforeTax >= 0 ? formatNGN(data.netProfitBeforeTax) : NEG(data.netProfitBeforeTax)}
            negative={data.netProfitBeforeTax < 0}
            large total
          />
          <StatementRow label="Net Margin" value={`${data.netMarginPct.toFixed(1)}%`} muted />

          {/* Workings (read-only) */}
          <Collapsible open={showWorkings} onOpenChange={setShowWorkings}>
            <CollapsibleTrigger className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium text-primary hover:underline">
              <Info className="h-3.5 w-3.5" />
              {showWorkings ? "Hide tax workings" : "Show tax workings"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 rounded-lg bg-secondary/40 p-4">
                <SectionHeading>Tax Computation Inputs</SectionHeading>
                <StatementRow label="Depreciation Add-back" value={formatNGN(data.depreciationAddback)} />
                <StatementRow label="Adjusted Profit" value={formatNGN(data.adjustedProfit)} bold />
                <StatementRow label="Unrecouped CA B/F"
                  value={unrecoupedCABF === 0 ? "—" : formatNGN(unrecoupedCABF)} muted />
                <StatementRow label="Annual Allowance (this year)"
                  value={annualAllowance === 0 ? "—" : formatNGN(annualAllowance)} muted />
                <StatementRow label="Total CA Available" value={formatNGN(data.totalCAAvailable)} />
                <StatementRow label="CA Relieved" value={NEG(data.caRelieved)} negative />
                <StatementRow label="Unrecouped CA C/F" value={formatNGN(data.unrecoupedCF)} />
                <StatementRow label="Assessable Income" value={formatNGN(data.assessableIncome)} bold />
                <StatementRow label="CIT Band" value={data.band} muted />
                <p className="text-[11px] text-muted-foreground mt-2">
                  CA values are sourced from the Capital Allowance module.
                  Retained Earnings B/F comes from Organisation Settings → Opening Balances.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <SectionHeading>Less: Taxation</SectionHeading>
          <StatementRow
            label={`Company Income Tax (${data.band} @ ${data.citRate}%)`}
            value={NEG(data.citPayable)} negative
          />
          <StatementRow label="Development Levy (@ 0.5% of revenue)" value={NEG(data.developmentLevy)} negative />
          <StatementRow
            label="Net Profit / (Loss) After Tax"
            value={data.netProfitAfterTax >= 0 ? formatNGN(data.netProfitAfterTax) : NEG(data.netProfitAfterTax)}
            negative={data.netProfitAfterTax < 0}
            large total
          />

          <StatementRow label="Retained Earnings B/F"
            value={retainedEarningsBF === 0 ? "—" : formatNGN(retainedEarningsBF)} muted />
          <StatementRow
            label="Retained Earnings Carried Forward"
            value={data.retainedEarningsCF >= 0 ? formatNGN(data.retainedEarningsCF) : NEG(data.retainedEarningsCF)}
            negative={data.retainedEarningsCF < 0}
            large total
          />
        </PageCard>

      </div>
    </AppShell>
  );
}

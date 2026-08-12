// TODO: Insert Balance Sheet snapshot card here (Total Assets / Total Liabilities / Total Equity side by side).
// TODO: Insert Cash Position chip here (closing cash balance from Cash Flow statement).
// 🔌 BACKEND: Both widgets should source from GET /dashboard/summary which aggregates these figures server-side.
import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import { caRepository } from "@/lib/repositories/ca.repository";
import { payeRepository } from "@/lib/repositories/paye.repository";
import { formatNGN, formatNGN as formatNGNCa, totalAA, totalPoolCost, totalTwdvCf, taxComputation } from "@/lib/services/ca.service";
import { formatNGN as formatNGNPaye, formatNGNCompact, formatPct, bandColor, bandDistribution } from "@/lib/services/paye.service";
import { YEARS } from "@/lib/mock-data/ca";
import { RUNS, CURRENT_PERIOD, MONTH_LONG, EMPLOYEES, periodLong, periodShort, prevPeriod, addMonths } from "@/lib/mock-data/paye";
import type { Period } from "@/lib/models/paye";
import { KpiCard } from "@/components/ca/KpiCard";
import { StatusBadge } from "@/components/ca/StatusBadge";
import { ArrowRight, Building2, Calculator, ChevronDown, TrendingUp, Users, Receipt, ShieldCheck, AlertTriangle, Lock as LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "overview" | "ca" | "paye";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <AppShell title="Dashboard">
      
      <div className="border-b border-border bg-card">
        <div className="px-6 flex items-center gap-1">
          {([
            { id: "overview", label: "Overview" },
            { id: "ca", label: "Capital Allowance" },
            { id: "paye", label: "PAYE Analysis" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-t-full" />}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {tab === "overview" && <OverviewTab />}
        {tab === "ca" && <CATab />}
        {tab === "paye" && <PayeAnalysisTab />}
      </div>
    </AppShell>
  );
}

/* ---------------- Overview Tab ---------------- */

function OverviewTab() {
  const { fiscalYear } = useFiscalYearStore();
  const year = caRepository.getByFiscalYear(fiscalYear)!;
  const t = year.status !== "not_computed" ? taxComputation(year) : null;

  // Fake monthly Revenue vs Expenses for last 6 months derived from year totals
  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const p = addMonths(CURRENT_PERIOD, -(5 - i));
    const factor = 0.85 + i * 0.04;
    return {
      month: periodShort(p),
      Revenue: Math.round((year.grossIncome / 12) * factor),
      Expenses: Math.round(((year.costOfSales + year.expenses) / 12) * factor * 0.95),
    };
  });

  const totalRev = year.grossIncome;
  const totalExp = year.costOfSales + year.expenses;
  const net = totalRev - totalExp;

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Welcome back, Olamide</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial overview for FY {fiscalYear}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={formatNGN(totalRev)} sublabel={`Period to date · FY ${fiscalYear}`} />
        <KpiCard label="Total Expenses" value={formatNGN(totalExp)} sublabel="COGS + operating expenses" />
        <KpiCard
          label="Net Profit / (Loss)"
          value={<span className={net < 0 ? "text-danger" : ""}>{net < 0 ? `(${formatNGN(Math.abs(net))})` : formatNGN(net)}</span>}
          sublabel="Revenue minus Expenses"
        />
        <KpiCard
          label="CIT Payable"
          value={t ? formatNGN(t.citPayable) : <span className="text-muted-foreground">—</span>}
          sublabel={t ? `${t.citRate}% · ${t.band} band` : "Run tax computation to see"}
        />
      </div>

      <div className="data-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Revenue vs Expenses</h3>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatNGNCompact(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatNGN(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Revenue" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} barSize={24} />
              <Bar dataKey="Expenses" fill="hsl(var(--chart-rose))" radius={[3, 3, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Recent Fiscal Years</h3>
            <p className="text-xs text-muted-foreground">Quick access to historical computations</p>
          </div>
          <Link to="/taxation/capital-allowance/history" className="text-xs text-accent font-medium inline-flex items-center gap-1">
            View history <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Fiscal Year</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Pool Cost</th>
                <th className="text-right px-4 py-2.5">Annual Allowance</th>
                <th className="text-right px-4 py-2.5">CIT Payable</th>
              </tr>
            </thead>
            <tbody>
              {[...YEARS].reverse().map((y) => {
                const tt = y.status !== "not_computed" ? taxComputation(y) : null;
                return (
                  <tr key={y.fiscalYear}>
                    <td className="px-4 py-2.5 font-mono font-medium">FY {y.fiscalYear}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={y.status} /></td>
                    <td className="fig px-4 py-2.5">{formatNGNCa(totalPoolCost(y))}</td>
                    <td className="fig px-4 py-2.5">{formatNGNCa(totalAA(y))}</td>
                    <td className="fig px-4 py-2.5 font-semibold">{tt ? formatNGNCa(tt.citPayable) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ---------------- CA Summary Tab ---------------- */

function CATab() {
  const { fiscalYear } = useFiscalYearStore();
  const year = caRepository.getByFiscalYear(fiscalYear)!;
  const t = year.status !== "not_computed" ? taxComputation(year) : null;

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Capital Allowance — FY {fiscalYear}</h2>
          <p className="text-sm text-muted-foreground mt-1">Summary of NTA 2025 capital allowance position.</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={year.status} size="md" />
          <Link to="/taxation/capital-allowance" className="text-xs text-accent font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
            View Full Schedule <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Annual Allowance" value={formatNGNCa(totalAA(year))} sublabel={`Claimable — FY ${fiscalYear}`} />
        <KpiCard label="Total Pool Cost" value={formatNGNCa(totalPoolCost(year))} sublabel="Across 11 classifications" />
        <KpiCard label="TWDV Carried Forward" value={formatNGNCa(totalTwdvCf(year))} sublabel={`Tax Written Down Value at year end`} />
        <KpiCard
          label="Unrecouped CA"
          value={t ? formatNGNCa(t.unrecoupedCf) : <span className="text-muted-foreground">—</span>}
          sublabel={t ? `Carried forward to FY ${fiscalYear + 1}` : "Compute tax to see this"}
        />
      </div>

      <div className="data-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-accent" />
          <div>
            <div className="text-sm font-semibold">Capital Allowance Module</div>
            <div className="text-xs text-muted-foreground">Schedule, classifications, history and lock workflow</div>
          </div>
        </div>
        <Link to="/taxation/capital-allowance">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Open Module <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </>
  );
}

/* ---------------- PAYE Analysis Tab ---------------- */

function PayeAnalysisTab() {
  const [period, setPeriod] = useState<Period>(CURRENT_PERIOD);
  const run = payeRepository.getRunByPeriod(period);
  const prior = payeRepository.getRunByPeriod(prevPeriod(period));

  if (!run) {
    return (
      <div className="data-card p-12 text-center">
        <div className="text-sm text-muted-foreground">No payroll run available for {periodLong(period)}.</div>
      </div>
    );
  }

  const grossDelta = prior ? run.totals.gross - prior.totals.gross : 0;
  const payeDelta = prior ? run.totals.paye - prior.totals.paye : 0;

  // Last 12 months trend
  const trend = RUNS.map(r => ({
    month: periodShort(r.period),
    PAYE: r.totals.paye,
    NetPay: r.totals.net,
  }));

  // Donut data
  const dist = bandDistribution(run);
  const donutData = dist.map(d => ({
    name: d.rate === 0 ? "Exempt (0%)" : `${d.rate}%`,
    value: d.count,
    rate: d.rate,
    fill: bandColor(d.rate),
    avgPaye: d.count > 0 ? Math.round(d.totalPaye / d.count) : 0,
  }));

  const exemptCount = run.totals.exemptCount;
  const taxableCount = run.totals.headcount - exemptCount;

  // Period selector options - last 12 months + 2 future
  const periodOptions: Period[] = Array.from({ length: 12 }).map((_, i) => addMonths(CURRENT_PERIOD, -(11 - i)));

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">PAYE Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">Payroll command center for {periodLong(period)}.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="font-mono">
              {periodLong(period)} <ChevronDown className="h-3.5 w-3.5 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {[...periodOptions].reverse().map(p => (
              <DropdownMenuItem
                key={`${p.year}-${p.month}`}
                onClick={() => setPeriod(p)}
                className={cn(p.year === period.year && p.month === period.month && "bg-accent-soft")}
              >
                <span className="font-mono">{periodLong(p)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI Strip - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Gross Payroll"
          value={formatNGNPaye(run.totals.gross)}
          sublabel={`Gross Payroll — ${periodShort(period)}`}
          trend={prior ? { delta: grossDelta, periodLabel: `vs ${periodShort(prevPeriod(period))}` } : undefined}
        />
        <KpiCard
          label="PAYE Deducted"
          value={formatNGNPaye(run.totals.paye)}
          sublabel={`Withheld — ${periodShort(period)}`}
          trend={prior ? { delta: payeDelta, periodLabel: `vs ${periodShort(prevPeriod(period))}` } : undefined}
        />
        <KpiCard
          label="Total Net Pay"
          value={formatNGNPaye(run.totals.net)}
          sublabel="Net Pay Disbursed"
        />
        <KpiCard
          label="Avg Effective Tax Rate"
          value={formatPct(run.totals.avgEtr)}
          sublabel="Blended ETR across workforce"
          progress={{ pct: Math.min(100, run.totals.avgEtr * 4), label: `${exemptCount} exempt · ${taxableCount} taxable` }}
        />
        <RemittanceStatusCard run={run} period={period} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Donut - 60% */}
        <div className="xl:col-span-3 data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Workforce Tax Band Profile</h3>
              <p className="text-xs text-muted-foreground">{periodLong(period)} · NTA 2025 progressive bands</p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="relative h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.fill} stroke="hsl(var(--card))" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number, _n, props: any) => {
                      const p = props.payload;
                      const pct = ((v / run.totals.headcount) * 100).toFixed(1);
                      return [
                        <div key="t" className="space-y-0.5">
                          <div>Employees: <span className="font-mono font-semibold">{v}</span> ({pct}%)</div>
                          <div>Avg PAYE: <span className="font-mono">{formatNGNPaye(p.avgPaye)}</span></div>
                        </div>,
                        `Band ${p.name}`,
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Headcount</div>
                <div className="font-mono text-2xl font-semibold">{run.totals.headcount}</div>
              </div>
            </div>
            <div className="space-y-1.5">
              {donutData.map((d) => {
                const pct = ((d.value / run.totals.headcount) * 100).toFixed(1);
                return (
                  <div key={d.name} className="flex items-center gap-2 text-xs py-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.fill }} />
                    <span className="flex-1 text-foreground/85 font-medium">Band {d.name}</span>
                    <span className="font-mono text-muted-foreground">{d.value} emp</span>
                    <span className="font-mono text-muted-foreground w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Line chart - 40% */}
        <div className="xl:col-span-2 data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Payroll Trend</h3>
              <p className="text-xs text-muted-foreground">12 months · PAYE vs Net Pay</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatNGNCompact(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={56} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatNGNPaye(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="PAYE" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="NetPay" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Exempt vs Taxable + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Exempt vs Taxable Headcount</h3>
            <span className="text-xs text-muted-foreground">Threshold: ₦800,000 chargeable</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            <div className="bg-[hsl(var(--chart-slate))]" style={{ width: `${(exemptCount / run.totals.headcount) * 100}%` }} />
            <div className="bg-accent flex-1" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-[hsl(var(--chart-slate))]" /> Exempt
              </div>
              <div className="mt-1 font-mono text-xl font-semibold">{exemptCount}</div>
              <div className="text-[11px] text-muted-foreground">{((exemptCount / run.totals.headcount) * 100).toFixed(1)}% of workforce</div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-accent" /> Taxable
              </div>
              <div className="mt-1 font-mono text-xl font-semibold">{taxableCount}</div>
              <div className="text-[11px] text-muted-foreground">{((taxableCount / run.totals.headcount) * 100).toFixed(1)}% of workforce</div>
            </div>
          </div>
        </div>

        <QuickActions run={run} period={period} />
      </div>

      {/* Top earners snapshot */}
      <div className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Top PAYE Contributors</h3>
            <p className="text-xs text-muted-foreground">{periodLong(period)} · sorted by PAYE</p>
          </div>
          <Link to="/taxation/paye" className="text-xs text-accent font-medium inline-flex items-center gap-1">
            View Run → 
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Employee</th>
                <th className="text-left px-4 py-2.5">Department</th>
                <th className="text-right px-4 py-2.5">Gross</th>
                <th className="text-right px-4 py-2.5">PAYE</th>
                <th className="text-right px-4 py-2.5">Net</th>
              </tr>
            </thead>
            <tbody>
              {[...run.entries].sort((a, b) => b.monthlyPaye - a.monthlyPaye).slice(0, 5).map((e) => {
                const emp = payeRepository.getEmployeeById(e.employeeId)!;
                return (
                  <tr key={e.employeeId}>
                    <td className="px-4 py-2.5 font-medium">{emp.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{emp.department}</td>
                    <td className="fig px-4 py-2.5">{formatNGNPaye(e.monthlyGross)}</td>
                    <td className="fig px-4 py-2.5 font-semibold text-accent">{formatNGNPaye(e.monthlyPaye)}</td>
                    <td className="fig px-4 py-2.5 text-success">{formatNGNPaye(e.monthlyNet)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function RemittanceStatusCard({ run, period }: { run: ReturnType<typeof payeRepository.getRunByPeriod> & {}; period: Period }) {
  // Status logic
  const today = new Date(`${CURRENT_PERIOD.year}-${String(CURRENT_PERIOD.month).padStart(2, "0")}-15`);
  const next = addMonths(period, 1);
  const due = new Date(`${next.year}-${String(next.month).padStart(2,"0")}-10`);
  const daysToDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let badge: { label: string; cls: string; Icon: any; sub?: string };
  if (run.status !== "locked") {
    badge = { label: "Pending", cls: "bg-warning-soft text-warning border-warning/30", Icon: AlertTriangle, sub: "Lock the run to enable remittance" };
  } else if (run.remittance?.status === "submitted") {
    badge = { label: "Submitted", cls: "bg-success-soft text-success border-success/30", Icon: ShieldCheck, sub: `Ref: ${run.remittance.paymentRef}` };
  } else if (daysToDue < 0) {
    badge = { label: `Overdue · ${Math.abs(daysToDue)}d`, cls: "bg-danger/10 text-danger border-danger/30", Icon: AlertTriangle, sub: "Penalty accruing" };
  } else if (daysToDue <= 7) {
    badge = { label: `Due in ${daysToDue}d`, cls: "bg-danger/10 text-danger border-danger/30", Icon: Receipt, sub: `By ${due.toDateString().slice(4, 10)}` };
  } else {
    badge = { label: `Due in ${daysToDue}d`, cls: "bg-accent-soft text-accent border-accent/30", Icon: Receipt, sub: `By ${due.toDateString().slice(4, 10)}` };
  }

  return (
    <div className="data-card p-5 flex flex-col gap-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remittance Status</div>
      <div className={cn("inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold", badge.cls)}>
        <badge.Icon className="h-3.5 w-3.5" />
        {badge.label}
      </div>
      <div className="font-mono text-base font-semibold">{formatNGNPaye(run.totals.paye)}</div>
      <div className="text-xs text-muted-foreground -mt-1">{badge.sub}</div>
    </div>
  );
}

function QuickActions({ run, period }: { run: ReturnType<typeof payeRepository.getRunByPeriod> & {}; period: Period }) {
  const { status } = run;
  return (
    <div className="data-card p-5 flex flex-col gap-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</div>
      <div className="text-sm font-medium">{periodLong(period)} Payroll</div>

      {status === "no_run" && (
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
          <Calculator className="h-4 w-4 mr-2" /> Compute {MONTH_LONG[period.month - 1]} Payroll
        </Button>
      )}
      {status === "computed" && (
        <div className="space-y-2">
          <Link to="/taxation/paye" className="block">
            <Button variant="outline" className="w-full">Review Run <ArrowRight className="h-3.5 w-3.5 ml-2" /></Button>
          </Link>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
            Approve Run
          </Button>
        </div>
      )}
      {status === "approved" && (
        <div className="space-y-2">
          <Link to="/taxation/paye" className="block">
            <Button variant="outline" className="w-full">View Payroll <ArrowRight className="h-3.5 w-3.5 ml-2" /></Button>
          </Link>
          <Button className="bg-success text-success-foreground hover:bg-success/90 w-full">
            <LockIcon className="h-4 w-4 mr-2" /> Lock & Generate Remittance
          </Button>
        </div>
      )}
      {status === "locked" && (
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft text-success px-3 py-1.5 text-xs font-semibold">
            <LockIcon className="h-3.5 w-3.5" /> Locked
          </span>
          <Link to="/taxation/paye" className="block">
            <Button variant="outline" className="w-full text-sm">View Remittance <ArrowRight className="h-3.5 w-3.5 ml-2" /></Button>
          </Link>
        </div>
      )}
    </div>
  );
}

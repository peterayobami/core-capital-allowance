import { CALayout } from "@/components/ca/CALayout";
import { StatusBanner } from "@/components/ca/StatusBadge";
import { KpiCard } from "@/components/ca/KpiCard";
import { Button } from "@/components/ui/button";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import { caRepository } from "@/lib/repositories/ca.repository";
import {
  CLASSIFICATIONS, YEARS,
} from "@/lib/mock-data/ca";
import { formatNGN, formatPct, totalAA, totalPoolCost, totalTwdvCf, groupColor, taxComputation } from "@/lib/services/ca.service";
import { ArrowRight, Calculator, Lock, Eye, FileSpreadsheet, FileText } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, YAxis, XAxis, Tooltip, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export default function OverviewPage() {
  const { fiscalYear } = useFiscalYearStore();
  const year = caRepository.getByFiscalYear(fiscalYear);
  if (!year) return <CALayout breadcrumbs={["Taxation", "Capital Allowance"]}>No data for FY {fiscalYear}</CALayout>;

  const prior = YEARS.find((y) => y.fiscalYear === fiscalYear - 1);
  const totalAAValue = totalAA(year);
  const priorAA = prior ? totalAA(prior) : 0;
  const aaDelta = totalAAValue - priorAA;
  const poolCost = totalPoolCost(year);
  const twdvCf = totalTwdvCf(year);
  const twdvPct = poolCost ? (twdvCf / poolCost) * 100 : 0;
  const tax = year.status !== "not_computed" ? taxComputation(year) : null;

  const barData = year.rows
    .map((r) => {
      const c = CLASSIFICATIONS.find((x) => x.id === r.classificationId)!;
      return {
        name: c.shortName, aa: r.annualAllowance, rate: c.aaRate, pool: r.poolCost,
        twdvCf: r.twdvCf, color: groupColor(c.group),
      };
    })
    .sort((a, b) => b.aa - a.aa);

  const donutData = year.rows
    .filter((r) => r.poolCost > 0)
    .map((r) => {
      const c = CLASSIFICATIONS.find((x) => x.id === r.classificationId)!;
      return { name: c.shortName, value: r.poolCost, color: groupColor(c.group) };
    });

  return (
    <CALayout breadcrumbs={["Taxation", "Capital Allowance", "Overview"]}>
      {/* Status Banner */}
      <StatusBanner status={year.status} fiscalYear={fiscalYear} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Annual Allowance"
          value={formatNGN(totalAAValue)}
          sublabel={`Annual Allowance — FY ${fiscalYear}`}
          trend={prior ? { delta: aaDelta, periodLabel: `vs FY ${fiscalYear - 1}` } : undefined}
        />
        <KpiCard
          label="Total Pool Cost"
          value={formatNGN(poolCost)}
          sublabel="Cumulative original cost across all classifications"
        />
        <KpiCard
          label="TWDV Carried Forward"
          value={formatNGN(twdvCf)}
          sublabel={`Tax Written Down Value at 31 Dec ${fiscalYear}`}
          progress={{ pct: twdvPct, label: `${twdvPct.toFixed(1)}% of pool remaining` }}
        />
        <KpiCard
          label="Unrecouped Capital Allowance"
          value={tax ? formatNGN(tax.unrecoupedCf) : <span className="text-muted-foreground">—</span>}
          sublabel={tax ? `Carried forward to FY ${fiscalYear + 1}` : "Compute tax to see this"}
        />
      </div>

      {/* Quick actions */}
      <div className="data-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calculator className="h-4 w-4" />
          <span>Quick actions for FY {fiscalYear}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {year.status === "not_computed" && (
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Calculator className="h-4 w-4 mr-2" />
              Compute Capital Allowance for FY {fiscalYear}
            </Button>
          )}
          {year.status === "computed" && (
            <>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" /> Review Schedule
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button className="bg-success text-success-foreground hover:bg-success/90">
                <Lock className="h-4 w-4 mr-2" /> Lock Schedule
              </Button>
            </>
          )}
          {year.status === "locked" && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft text-success px-3 py-1.5 text-xs font-semibold">
                <Lock className="h-3.5 w-3.5" /> Locked
              </span>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" /> View Schedule
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                Proceed to Tax Computation <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Annual Allowance by Asset Class</h3>
              <p className="text-xs text-muted-foreground">FY {fiscalYear} · sorted by AA value</p>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Hover bars for details</span>
            </div>
          </div>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 24, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={170}
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary))" }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, _name, props) => {
                    const p = props.payload as any;
                    return [
                      <div key="t" className="space-y-0.5">
                        <div>AA Rate: <span className="font-mono">{formatPct(p.rate)}</span></div>
                        <div>Pool Cost: <span className="font-mono">{formatNGN(p.pool)}</span></div>
                        <div>AA: <span className="font-mono">{formatNGN(value)}</span></div>
                        <div>TWDV C/F: <span className="font-mono">{formatNGN(p.twdvCf)}</span></div>
                      </div>,
                      p.name,
                    ];
                  }}
                />
                <Bar dataKey="aa" radius={[0, 4, 4, 0]} barSize={18}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.aa === 0 ? "hsl(var(--muted))" : d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 data-card p-5 flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold">Asset Pool Distribution</h3>
            <p className="text-xs text-muted-foreground">FY {fiscalYear} · share of pool cost</p>
          </div>
          <div className="relative flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatNGN(v), "Pool Cost"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Pool</div>
              <div className="font-mono text-base font-semibold">{formatNGN(poolCost)}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1 max-h-44 overflow-y-auto pr-1">
            {donutData.map((d) => {
              const pct = poolCost ? (d.value / poolCost) * 100 : 0;
              return (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />
                  <span className="flex-1 truncate text-foreground/80">{d.name}</span>
                  <span className="font-mono text-muted-foreground">{formatNGN(d.value)}</span>
                  <span className="font-mono text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pool Health Table */}
      <div className="data-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold">Pool Health</h3>
            <p className="text-xs text-muted-foreground">Current state of every classification at end of FY {fiscalYear}</p>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Classification</th>
                <th className="text-right px-4 py-2.5">Pool Cost</th>
                <th className="text-right px-4 py-2.5">TWDV B/F</th>
                <th className="text-right px-4 py-2.5">Additions</th>
                <th className="text-center px-4 py-2.5">AA Rate</th>
                <th className="text-right px-4 py-2.5">Annual Allowance</th>
                <th className="text-right px-4 py-2.5">1% Floor</th>
                <th className="text-right px-4 py-2.5">TWDV C/F</th>
                <th className="text-center px-4 py-2.5">Useful Life</th>
              </tr>
            </thead>
            <tbody>
              {year.rows.map((r) => {
                const c = CLASSIFICATIONS.find((x) => x.id === r.classificationId)!;
                const muted = c.aaRate === 0;
                const floorBinding = !muted && r.twdvCf === r.retentionFloor;
                return (
                  <tr key={r.classificationId} className={cn(muted && "text-muted-foreground/70")}>
                    <td className="px-4 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-sm" style={{ background: groupColor(c.group) }} />
                        {c.name}
                      </div>
                    </td>
                    <td className="fig px-4 py-2.5">{formatNGN(r.poolCost)}</td>
                    <td className="fig px-4 py-2.5">{formatNGN(r.twdvBf)}</td>
                    <td className="fig px-4 py-2.5">{formatNGN(r.additions)}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-xs">{formatPct(c.aaRate)}</td>
                    <td className="fig px-4 py-2.5 font-semibold">{formatNGN(r.annualAllowance)}</td>
                    <td className={cn("fig px-4 py-2.5", floorBinding && "text-warning")}>{formatNGN(r.retentionFloor)}</td>
                    <td className="fig px-4 py-2.5 font-semibold">{formatNGN(r.twdvCf)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        c.usefulLife ? "border-border text-foreground/80 bg-secondary" : "border-border text-muted-foreground bg-secondary/50",
                      )}>
                        {c.usefulLife ? `${c.usefulLife} yrs` : "N/A"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-4 py-3" colSpan={5}>TOTALS</td>
                <td className="fig px-4 py-3">{formatNGN(totalAAValue)}</td>
                <td className="fig px-4 py-3">{formatNGN(year.rows.reduce((s, r) => s + r.retentionFloor, 0))}</td>
                <td className="fig px-4 py-3">{formatNGN(twdvCf)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </CALayout>
  );
}

import { CALayout } from "@/components/ca/CALayout";
import { StatusBadge } from "@/components/ca/StatusBadge";
import { YEARS } from "@/lib/mock-data/ca";
import { formatNGN, totalAA, totalPoolCost, totalTwdvCf, taxComputation } from "@/lib/services/ca.service";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import { Eye, Calculator } from "lucide-react";

export default function HistoryPage() {
  const { setFiscalYear } = useFiscalYearStore();

  const trendData = YEARS.map((y) => ({
    fy: `FY ${y.fiscalYear}`,
    Pool: totalPoolCost(y),
    AA: totalAA(y),
    TWDV: totalTwdvCf(y),
  }));

  const utilData = YEARS.map((y) => {
    const aa = totalAA(y);
    const t = y.status !== "not_computed" ? taxComputation(y) : null;
    const relieved = t ? t.caRelieved : 0;
    const unrecouped = t ? t.unrecoupedCf : 0;
    const remainingTwdv = totalTwdvCf(y);
    return { fy: `FY ${y.fiscalYear}`, Relieved: relieved, Unrecouped: unrecouped, RemainingTWDV: remainingTwdv };
  });

  return (
    <CALayout breadcrumbs={["Taxation", "Capital Allowance", "History"]}>
      <div>
        <h1 className="text-xl font-semibold">Capital Allowance History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-year trend, comparison and utilisation analysis.
        </p>
      </div>

      {/* Trend chart */}
      <div className="data-card p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Pool Depletion Trend</h3>
          <p className="text-xs text-muted-foreground">Last 5 fiscal years · pool cost vs annual allowance vs TWDV C/F</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ left: 12, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fy" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatNGN(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Pool" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Pool Cost" />
              <Line type="monotone" dataKey="AA" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="Annual Allowance" />
              <Line type="monotone" dataKey="TWDV" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} name="TWDV C/F" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison table */}
      <div className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Year-by-Year Comparison</h3>
          <p className="text-xs text-muted-foreground">All available fiscal years with summary figures</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">FY</th>
                <th className="text-left px-4 py-2.5">AY</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Pool Cost</th>
                <th className="text-right px-4 py-2.5">Total AA</th>
                <th className="text-right px-4 py-2.5">TWDV C/F</th>
                <th className="text-right px-4 py-2.5">Unrecouped CA</th>
                <th className="text-right px-4 py-2.5">Assessable Income</th>
                <th className="text-right px-4 py-2.5">CIT Payable</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...YEARS].reverse().map((y) => {
                const t = y.status !== "not_computed" ? taxComputation(y) : null;
                const computedItalic = y.status === "computed";
                return (
                  <tr key={y.fiscalYear}>
                    <td className="px-4 py-2.5 font-mono font-semibold">FY {y.fiscalYear}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">AY {y.assessmentYear}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={y.status} /></td>
                    <td className={cn("fig px-4 py-2.5", computedItalic && "italic text-warning")}>{formatNGN(totalPoolCost(y))}</td>
                    <td className={cn("fig px-4 py-2.5", computedItalic && "italic text-warning")}>{formatNGN(totalAA(y))}</td>
                    <td className={cn("fig px-4 py-2.5", computedItalic && "italic text-warning")}>{formatNGN(totalTwdvCf(y))}</td>
                    <td className={cn("fig px-4 py-2.5", computedItalic && "italic text-warning")}>{t ? formatNGN(t.unrecoupedCf) : "—"}</td>
                    <td className={cn("fig px-4 py-2.5", computedItalic && "italic text-warning")}>{t ? formatNGN(t.assessableIncome) : "—"}</td>
                    <td className={cn("fig px-4 py-2.5 font-semibold", computedItalic && "italic text-warning")}>{t ? formatNGN(t.citPayable) : "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button onClick={() => setFiscalYear(y.fiscalYear)} className="text-accent hover:underline inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Schedule
                        </button>
                        <span className="text-border">|</span>
                        <button onClick={() => setFiscalYear(y.fiscalYear)} className="text-accent hover:underline inline-flex items-center gap-1">
                          <Calculator className="h-3 w-3" /> Tax
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CA Utilisation chart */}
      <div className="data-card p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Capital Allowance Utilisation by Year</h3>
          <p className="text-xs text-muted-foreground">Stacked: relieved against profit · unrecouped C/F · remaining TWDV</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilData} margin={{ left: 12, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fy" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatNGN(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Relieved" stackId="a" fill="hsl(var(--accent))" name="CA Relieved" />
              <Bar dataKey="Unrecouped" stackId="a" fill="hsl(var(--chart-slate))" name="Unrecouped C/F" />
              <Bar dataKey="RemainingTWDV" stackId="a" fill="hsl(var(--chart-emerald) / 0.4)" name="Remaining TWDV" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </CALayout>
  );
}

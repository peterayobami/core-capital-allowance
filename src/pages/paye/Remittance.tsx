import { useMemo } from "react";
import { PAYELayout } from "@/components/paye/PAYELayout";
import { RemittanceBadge } from "@/components/paye/RunStatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RUNS, periodKey, periodLong, CURRENT_PERIOD,
  prevPeriod, EMPLOYEES,
} from "@/lib/mock-data/paye";
import { payeRepository } from "@/lib/repositories/paye.repository";
import { formatNGN, formatNGNCompact } from "@/lib/services/paye.service";
import { Send, Download, AlertCircle, CheckCircle2 } from "lucide-react";

const STATE_AUTHORITY: Record<string, { name: string; code: string }> = {
  "Lagos":      { name: "Lagos LIRS",   code: "LAG-123456" },
  "Abuja":      { name: "FCT Abuja",    code: "FCT-789012" },
  "FCT Abuja":  { name: "FCT Abuja",    code: "FCT-789012" },
  "Rivers":     { name: "Rivers RIRS",  code: "RIV-345678" },
  "Oyo":        { name: "Oyo OYSIRS",   code: "OYO-901234" },
  "Kano":       { name: "Kano KSIRS",   code: "KAN-456789" },
  "Kaduna":     { name: "Kaduna KSBIR", code: "KAD-234567" },
  "Akwa Ibom":  { name: "Akwa Ibom IRS",code: "AKW-678901" },
};

export default function Remittance() {
  const current = payeRepository.getRunByPeriod(CURRENT_PERIOD)!;
  const allRuns = useMemo(() => [...RUNS].reverse(), []);

  // Today reference for due-date math (matches mock data)
  const today = new Date(`${CURRENT_PERIOD.year}-${String(CURRENT_PERIOD.month).padStart(2, "0")}-15`);
  // Current period due date is 10th of next month
  const next = current.period.month === 12
    ? { y: current.period.year + 1, m: 1 }
    : { y: current.period.year, m: current.period.month + 1 };
  const dueDate = new Date(`${next.y}-${String(next.m).padStart(2, "0")}-10`);
  const daysToDeadline = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const totalWindow = 30;
  const progressPct = Math.min(100, Math.max(0, ((totalWindow - daysToDeadline) / totalWindow) * 100));

  // Aggregations
  const ytd = allRuns
    .filter(r => r.period.year === CURRENT_PERIOD.year && r.remittance && r.remittance.status === "submitted")
    .reduce((s, r) => s + r.remittance!.amount, 0);

  const onTimeMonths = allRuns
    .filter(r => r.remittance && r.remittance.status === "submitted")
    .filter(r => r.remittance!.submittedDate && new Date(r.remittance!.submittedDate) <= new Date(r.remittance!.dueDate))
    .length;

  const taxableEmployees = current.entries.filter(e => !e.isExempt).length;

  // State-routing aggregation for current run
  const byState = useMemo(() => {
    const buckets: Record<string, { state: string; count: number; amount: number }> = {};
    current.entries.forEach(e => {
      const emp = EMPLOYEES.find(x => x.id === e.employeeId);
      const st = emp?.profile.state ?? "Other";
      if (!buckets[st]) buckets[st] = { state: st, count: 0, amount: 0 };
      buckets[st].count += 1;
      buckets[st].amount += e.monthlyPaye;
    });
    return Object.values(buckets).sort((a, b) => b.amount - a.amount);
  }, [current]);

  // Form H1 sample (first 4 taxable rows)
  const h1Sample = current.entries
    .filter(e => !e.isExempt)
    .slice(0, 4)
    .map(e => ({
      ...e,
      employee: EMPLOYEES.find(x => x.id === e.employeeId)!,
    }));
  const h1RestCount = taxableEmployees - h1Sample.length;
  const h1RestGross = current.entries
    .filter(e => !e.isExempt)
    .slice(4)
    .reduce((s, e) => s + e.monthlyGross, 0);
  const h1RestPaye = current.entries
    .filter(e => !e.isExempt)
    .slice(4)
    .reduce((s, e) => s + e.monthlyPaye, 0);

  const history = allRuns.filter(r => r.remittance).slice(0, 4);

  return (
    <PAYELayout breadcrumbs={["Taxation", "PAYE", "Remittance"]}>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Period: <span className="font-medium text-foreground">{periodLong(CURRENT_PERIOD)}</span></span>
        <span>·</span>
        <span>Company: <span className="font-medium text-foreground">Bechellente Ltd</span></span>
      </div>

      <div>
        <h1 className="text-xl font-semibold">PAYE Remittance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly tax filing and payment tracking.
        </p>
      </div>

      {/* Summary cards (3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Current Period Due</div>
          <div className="font-mono text-2xl font-semibold mt-2 tabular-nums">
            {formatNGNCompact(current.totals.paye)}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-warning bg-warning-soft border border-warning/30 px-2 py-0.5 rounded-full">
            {daysToDeadline} days remaining
          </div>
        </div>
        <div className="data-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">YTD Remitted</div>
          <div className="font-mono text-2xl font-semibold mt-2 tabular-nums">
            {formatNGNCompact(ytd)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {onTimeMonths} months on-time
          </div>
        </div>
        <div className="data-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Penalty Exposure</div>
          <div className="font-mono text-2xl font-semibold mt-2 tabular-nums">₦0</div>
          <div className="text-xs text-success mt-1">No late payments</div>
        </div>
      </div>

      {/* Current Month Details + State Routing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="data-card p-5 space-y-4 lg:col-span-7">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold">Current Month Remittance</h3>
              <p className="text-[11px] text-muted-foreground">{periodLong(CURRENT_PERIOD)} filing details</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-warning flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Due Date Approaching
              </div>
              <div className="text-[11px] text-muted-foreground">
                Payment due by {dueDate.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <DetailRow label="Remittance Amount" value={formatNGN(current.totals.paye)} />
            <DetailRow label="Total Employees" value={String(current.totals.headcount)} />
            <DetailRow label="Taxable Employees" value={String(taxableEmployees)} />
            <DetailRow label="Days to Deadline" value={`${daysToDeadline} days`} />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Time Remaining</span>
              <span className="font-medium">{daysToDeadline} / {totalWindow} days</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Send className="h-3.5 w-3.5 mr-2" /> Submit Remittance
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5 mr-2" /> Download H1
            </Button>
          </div>
        </section>

        <section className="data-card overflow-hidden lg:col-span-5">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">State Revenue Service Routing</h3>
            <p className="text-[11px] text-muted-foreground">Distribution by employee state</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2.5">State Authority</th>
                  <th className="text-right px-4 py-2.5">Emp.</th>
                  <th className="text-right px-4 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {byState.map(b => {
                  const auth = STATE_AUTHORITY[b.state] ?? { name: b.state, code: "—" };
                  return (
                    <tr key={b.state}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-xs">{auth.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{auth.code}</div>
                      </td>
                      <td className="fig px-4 py-2.5">{b.count}</td>
                      <td className="fig px-4 py-2.5 font-semibold">{formatNGNCompact(b.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
            Under PITA 2025, each state receives remittance directly for their residents.
          </div>
        </section>
      </div>

      {/* Form H1 */}
      <section className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Monthly PAYE Schedule (Form H1)</h3>
          <p className="text-[11px] text-muted-foreground">
            Sample of {periodLong(CURRENT_PERIOD)} employee-level breakdown
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Employee Name</th>
                <th className="text-left px-4 py-2.5">Tax ID (TIN)</th>
                <th className="text-right px-4 py-2.5">Gross Income</th>
                <th className="text-right px-4 py-2.5">PAYE Deducted</th>
              </tr>
            </thead>
            <tbody>
              {h1Sample.map(row => (
                <tr key={row.employeeId}>
                  <td className="px-4 py-2.5 font-medium">{row.employee.name}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {row.employee.profile.tin ?? "—"}
                  </td>
                  <td className="fig px-4 py-2.5">{formatNGN(row.monthlyGross)}</td>
                  <td className="fig px-4 py-2.5 font-semibold">{formatNGN(row.monthlyPaye)}</td>
                </tr>
              ))}
              {h1RestCount > 0 && (
                <tr className="bg-secondary/30">
                  <td className="px-4 py-2.5 italic text-muted-foreground" colSpan={2}>
                    … ({h1RestCount} more employees)
                  </td>
                  <td className="fig px-4 py-2.5">{formatNGN(h1RestGross)}</td>
                  <td className="fig px-4 py-2.5 font-semibold">{formatNGN(h1RestPaye)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* History */}
      <section className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Remittance History</h3>
          <p className="text-[11px] text-muted-foreground">Past months payment tracking</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Period</th>
                <th className="text-right px-4 py-2.5">Amount</th>
                <th className="text-left px-4 py-2.5">Due Date</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-left px-4 py-2.5">Reference</th>
              </tr>
            </thead>
            <tbody>
              {history.map(r => {
                const rem = r.remittance!;
                return (
                  <tr key={periodKey(r.period)}>
                    <td className="px-4 py-2.5 font-medium">{periodLong(r.period)}</td>
                    <td className="fig px-4 py-2.5 font-semibold">{formatNGN(rem.amount)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{rem.dueDate}</td>
                    <td className="px-4 py-2.5"><RemittanceBadge status={rem.status} /></td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {rem.paymentRef ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PAYELayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-base font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

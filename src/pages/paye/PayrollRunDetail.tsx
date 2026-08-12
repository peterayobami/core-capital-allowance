import { useParams, Link } from "react-router-dom";
import { PAYELayout } from "@/components/paye/PAYELayout";
import { KpiCard } from "@/components/ca/KpiCard";
import { RunStatusBadge, RemittanceBadge, BandChip } from "@/components/paye/RunStatusBadge";
import { Button } from "@/components/ui/button";
import {
  RUNS, periodKey, periodLong, periodShort,
  prevPeriod,
} from "@/lib/mock-data/paye";
import { payeRepository } from "@/lib/repositories/paye.repository";
import { formatNGN, formatNGNCompact, formatPct } from "@/lib/services/paye.service";
import { ArrowLeft, Download, ShieldCheck, Lock, FileText, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PayrollRunDetail() {
  const { runKey } = useParams<{ runKey: string }>();
  const run = RUNS.find(r => periodKey(r.period) === runKey);

  if (!run) {
    return (
      <PAYELayout breadcrumbs={["Taxation", "PAYE", "Payroll Runs", "Not Found"]}>
        <div className="data-card p-12 text-center">
          <div className="text-sm text-muted-foreground">Payroll run not found.</div>
          <Link to="/taxation/paye" className="text-xs text-accent font-medium mt-3 inline-block">← Back to runs</Link>
        </div>
      </PAYELayout>
    );
  }

  const prior = RUNS.find(r => periodKey(r.period) === periodKey(prevPeriod(run.period)));

  return (
    <PAYELayout breadcrumbs={["Taxation", "PAYE", "Payroll Runs", periodLong(run.period)]}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link to="/taxation/paye" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-2">
            <ArrowLeft className="h-3 w-3" /> All Runs
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{periodLong(run.period)}</h1>
            <RunStatusBadge status={run.status} size="md" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {run.totals.headcount} employees · Avg ETR {formatPct(run.totals.avgEtr)}
            {run.lockedAt && ` · Locked by ${run.lockedBy} on ${run.lockedAt}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-3.5 w-3.5 mr-2" /> Form H1
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-2" /> Export Payslips
          </Button>
          {run.status === "computed" && (
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Approve
            </Button>
          )}
          {run.status === "approved" && (
            <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90">
              <Lock className="h-3.5 w-3.5 mr-2" /> Lock
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Gross Payroll" value={formatNGN(run.totals.gross)} sublabel="Total monthly emoluments" />
        <KpiCard label="PAYE Withheld" value={formatNGN(run.totals.paye)} sublabel={`Avg ETR ${formatPct(run.totals.avgEtr)}`} />
        <KpiCard label="Pension + NHF" value={formatNGN(run.totals.pension + run.totals.nhf)} sublabel="Statutory deductions" />
        <KpiCard label="Net Pay" value={formatNGN(run.totals.net)} sublabel={`${run.totals.exemptCount} exempt employees`} />
      </div>

      {run.remittance && (
        <div className="data-card p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <RemittanceBadge status={run.remittance.status} size="md" />
            <div className="text-xs">
              <div className="font-medium">Remittance: {formatNGN(run.remittance.amount)}</div>
              <div className="text-muted-foreground">
                Due {run.remittance.dueDate}
                {run.remittance.submittedDate && ` · Submitted ${run.remittance.submittedDate} · ${run.remittance.paymentRef}`}
              </div>
            </div>
          </div>
          <Link to="/taxation/paye/remittance" className="text-xs text-accent font-medium">View tracker →</Link>
        </div>
      )}

      <div className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Employee Breakdown</h3>
          <p className="text-xs text-muted-foreground">Per-employee PAYE for {periodShort(run.period)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Employee</th>
                <th className="text-left px-4 py-2.5">Department</th>
                <th className="text-center px-4 py-2.5">Band</th>
                <th className="text-right px-4 py-2.5">Gross</th>
                <th className="text-right px-4 py-2.5">Pension</th>
                <th className="text-right px-4 py-2.5">NHF</th>
                <th className="text-right px-4 py-2.5">PAYE</th>
                <th className="text-center px-4 py-2.5 w-16">Δ vs prior</th>
                <th className="text-right px-4 py-2.5">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {run.entries.map((e) => {
                const emp = payeRepository.getEmployeeById(e.employeeId);
                const delta = e.priorMonthlyPaye !== undefined ? e.monthlyPaye - e.priorMonthlyPaye : null;
                return (
                  <tr key={e.employeeId}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{emp?.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{emp?.id}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{emp?.department}</td>
                    <td className="px-4 py-2.5 text-center">
                      {e.isExempt ? <BandChip rate={0} /> : <BandChip rate={e.highestBand} />}
                    </td>
                    <td className="fig px-4 py-2.5">{formatNGNCompact(e.monthlyGross)}</td>
                    <td className="fig px-4 py-2.5 text-muted-foreground">{formatNGNCompact(e.monthlyPension)}</td>
                    <td className="fig px-4 py-2.5 text-muted-foreground">{formatNGNCompact(e.monthlyNhf)}</td>
                    <td className="fig px-4 py-2.5 font-semibold">{formatNGNCompact(e.monthlyPaye)}</td>
                    <td className="px-4 py-2.5">
                      {delta === null ? (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      ) : Math.abs(delta) < 50 ? (
                        <span className="inline-flex items-center justify-center text-[11px] text-muted-foreground">
                          <Minus className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center justify-center gap-0.5 text-[11px] font-mono",
                          delta > 0 ? "text-danger" : "text-success",
                        )}>
                          {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {formatNGNCompact(Math.abs(delta))}
                        </span>
                      )}
                    </td>
                    <td className="fig px-4 py-2.5">{formatNGNCompact(e.monthlyNet)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-4 py-2.5 font-semibold" colSpan={3}>Totals · {run.totals.headcount} employees</td>
                <td className="fig px-4 py-2.5">{formatNGN(run.totals.gross)}</td>
                <td className="fig px-4 py-2.5">{formatNGN(run.totals.pension)}</td>
                <td className="fig px-4 py-2.5">{formatNGN(run.totals.nhf)}</td>
                <td className="fig px-4 py-2.5">{formatNGN(run.totals.paye)}</td>
                <td></td>
                <td className="fig px-4 py-2.5">{formatNGN(run.totals.net)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </PAYELayout>
  );
}

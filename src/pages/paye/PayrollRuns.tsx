import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PAYELayout } from "@/components/paye/PAYELayout";
import { BandChip, RunStatusBadge } from "@/components/paye/RunStatusBadge";
import { Button } from "@/components/ui/button";
import {
  RUNS, CURRENT_PERIOD, periodLong, periodShort, periodKey,
  prevPeriod, EMPLOYEES,
} from "@/lib/mock-data/paye";
import { payeRepository } from "@/lib/repositories/paye.repository";
import { formatNGN, formatNGNCompact, formatPct, validateForRun } from "@/lib/services/paye.service";
import {
  Calculator, CheckCircle2, AlertTriangle, ArrowRight, Download, ShieldCheck, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PayrollRuns() {
  const current = payeRepository.getRunByPeriod(CURRENT_PERIOD)!;
  const prior = payeRepository.getRunByPeriod(prevPeriod(CURRENT_PERIOD));
  const issues = useMemo(() => validateForRun(EMPLOYEES), []);

  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const validTinCount = EMPLOYEES.filter(e => e.profile.hasProfile && e.profile.tin).length;
  const totalConfigured = EMPLOYEES.filter(e => e.profile.hasProfile).length;
  const missingRent = EMPLOYEES.filter(e => e.profile.hasProfile && e.profile.rentPaid > 0 && !e.profile.rentReliefApproved).length;

  return (
    <PAYELayout breadcrumbs={["Taxation", "PAYE", "Payroll Run"]}>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Period: <span className="font-medium text-foreground">{periodLong(CURRENT_PERIOD)}</span></span>
        <span>·</span>
        <span>Company: <span className="font-medium text-foreground">Bechellente Ltd</span></span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Payroll Run</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compute and approve monthly PAYE deductions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunStatusBadge status={current.status} size="md" />
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-2" /> Export
          </Button>
          {current.status === "computed" && (
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Approve Run
            </Button>
          )}
          {current.status === "approved" && (
            <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90">
              <Lock className="h-3.5 w-3.5 mr-2" /> Lock Run
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards (4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Employees" value={String(current.totals.headcount)} />
        <SummaryCard label="Total Gross" value={formatNGN(current.totals.gross)} />
        <SummaryCard label="Total PAYE" value={formatNGN(current.totals.paye)} />
        <SummaryCard label="Total Net Pay" value={formatNGN(current.totals.net)} />
      </div>

      {/* Pre-run Validation */}
      <section className="data-card p-5 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold">Pre-run Validation</h3>
            <p className="text-[11px] text-muted-foreground">
              {errorCount === 0 ? "No blocking errors" : `${errorCount} error(s)`} · {warningCount} warning(s)
            </p>
          </div>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={errorCount > 0}
          >
            <Calculator className="h-3.5 w-3.5 mr-2" />
            Run PAYE Computation
          </Button>
        </div>

        <div className="space-y-2">
          <ValidationRow
            ok={validTinCount === totalConfigured}
            okText="All employees have valid TINs"
            warnText={`${totalConfigured - validTinCount} employee(s) missing TIN`}
            detail={`${validTinCount}/${totalConfigured} verified`}
          />
          <ValidationRow
            ok={missingRent === 0}
            okText="All rent-relief claims have receipts on file"
            warnText={`${missingRent} employee(s) missing rent receipts`}
            detail="Rent relief will not be applied"
          />
          <ValidationRow
            ok={true}
            okText="All statutory deduction documents current"
            detail="Pension, NHF verified"
          />
        </div>
      </section>

      {/* Payroll Review Table */}
      <section className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Payroll Review Table</h3>
          <p className="text-[11px] text-muted-foreground">
            {periodLong(CURRENT_PERIOD)} PAYE computation results
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Employee</th>
                <th className="text-right px-4 py-2.5">Gross</th>
                <th className="text-right px-4 py-2.5">Pension</th>
                <th className="text-right px-4 py-2.5">NHF</th>
                <th className="text-right px-4 py-2.5">Rent Relief</th>
                <th className="text-right px-4 py-2.5">Chargeable</th>
                <th className="text-center px-4 py-2.5">Band</th>
                <th className="text-right px-4 py-2.5">PAYE</th>
                <th className="text-right px-4 py-2.5">Net Pay</th>
                <th className="text-right px-4 py-2.5">Δ vs Prior</th>
              </tr>
            </thead>
            <tbody>
              {current.entries.map((e) => {
                const emp = payeRepository.getEmployeeById(e.employeeId);
                const delta = e.priorMonthlyPaye !== undefined && e.priorMonthlyPaye > 0
                  ? ((e.monthlyPaye - e.priorMonthlyPaye) / e.priorMonthlyPaye) * 100
                  : null;
                return (
                  <tr key={e.employeeId}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{emp?.name}</div>
                      {e.isExempt && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Exempt</span>
                      )}
                    </td>
                    <td className="fig px-4 py-2.5">{formatNGNCompact(e.monthlyGross)}</td>
                    <td className="fig px-4 py-2.5 text-muted-foreground">{formatNGNCompact(e.monthlyPension)}</td>
                    <td className="fig px-4 py-2.5 text-muted-foreground">{formatNGNCompact(e.monthlyNhf)}</td>
                    <td className="fig px-4 py-2.5 text-muted-foreground">
                      {e.monthlyRentRelief > 0 ? formatNGNCompact(e.monthlyRentRelief) : "—"}
                    </td>
                    <td className="fig px-4 py-2.5">{formatNGNCompact(e.monthlyChargeable)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <BandChip rate={e.isExempt ? 0 : e.highestBand} />
                    </td>
                    <td className="fig px-4 py-2.5 font-semibold">{formatNGNCompact(e.monthlyPaye)}</td>
                    <td className="fig px-4 py-2.5">{formatNGNCompact(e.monthlyNet)}</td>
                    <td className="fig px-4 py-2.5">
                      {delta === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={cn(
                          "text-[11px] font-medium",
                          delta > 0 ? "text-warning" : delta < 0 ? "text-success" : "text-muted-foreground",
                        )}>
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Run history snapshot */}
      <section className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Recent Runs</h3>
          <p className="text-[11px] text-muted-foreground">Past payroll periods</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5">Period</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Gross</th>
                <th className="text-right px-4 py-2.5">PAYE</th>
                <th className="text-right px-4 py-2.5">Net</th>
                <th className="text-right px-4 py-2.5">ETR</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {[...RUNS].reverse().slice(0, 6).map((r) => (
                <tr key={periodKey(r.period)}>
                  <td className="px-4 py-2.5 font-medium">{periodLong(r.period)}</td>
                  <td className="px-4 py-2.5"><RunStatusBadge status={r.status} /></td>
                  <td className="fig px-4 py-2.5">{formatNGNCompact(r.totals.gross)}</td>
                  <td className="fig px-4 py-2.5 font-semibold">{formatNGNCompact(r.totals.paye)}</td>
                  <td className="fig px-4 py-2.5">{formatNGNCompact(r.totals.net)}</td>
                  <td className="fig px-4 py-2.5">{formatPct(r.totals.avgEtr)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to={`/taxation/paye/runs/${periodKey(r.period)}`}
                      className="text-xs text-accent font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PAYELayout>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-mono text-2xl font-semibold mt-2 tabular-nums">{value}</div>
    </div>
  );
}

function ValidationRow({
  ok, okText, warnText, detail,
}: { ok: boolean; okText: string; warnText?: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{ok ? okText : (warnText ?? okText)}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

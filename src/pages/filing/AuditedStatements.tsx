import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageCard, Tag } from "@/components/reports/ReportPrimitives";
import { FilingYearSelect } from "@/components/filing/FilingYearSelect";
import { Button } from "@/components/ui/button";
import { Printer, Stamp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { defaultYear } from "@/lib/services/tax.service";
import { computeBalanceSheet, computeCashFlow } from "@/lib/services/ledger.service";
import {
  pnlFor, resolveClassification, computeChangesInEquity, computeValueAdded,
  computeFinancialSummary, computeNotes,
} from "@/lib/services/afs.service";
import type { BSInputs, BalanceSheetItem, BalanceSheetStatement } from "@/lib/models/ledger";
import type { ComparativeRow, ChangesInEquityRow, ValueAddedLine } from "@/lib/models/filing";
import { selectOpeningBalance, useOrgSettings } from "@/stores/org-settings.store";
import { filingRepository } from "@/lib/repositories/filing.repository";
import { useFilingHistory } from "@/hooks/filing/use-filing";
import { formatNGN, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FMT = (n: number) => (n < 0 ? `(${formatNGN(Math.abs(n))})` : formatNGN(n));
const CELL = (n: number | null) => (n === null ? "—" : FMT(n));

function NoteRef({ n }: { n: number }) {
  return <span className="ml-1.5 text-[10px] font-medium text-primary">Note {n}</span>;
}

/** Comparative table: FY current vs FY prior, grouped by section headings. */
function CompTable({
  groups, year, hasPrior,
}: {
  groups: { heading?: string; rows: ComparativeRow[] }[];
  year: number;
  hasPrior: boolean;
}) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <th className="py-2 font-semibold">Particulars</th>
          <th className="py-2 font-semibold text-right w-40">FY {year} (₦)</th>
          {hasPrior && <th className="py-2 font-semibold text-right w-40">FY {year - 1} (₦)</th>}
        </tr>
      </thead>
      <tbody>
        {groups.map((g, gi) => (
          <GroupRows key={gi} group={g} hasPrior={hasPrior} />
        ))}
      </tbody>
    </table>
  );
}

function GroupRows({
  group, hasPrior,
}: { group: { heading?: string; rows: ComparativeRow[] }; hasPrior: boolean }) {
  return (
    <>
      {group.heading && (
        <tr>
          <td
            colSpan={hasPrior ? 3 : 2}
            className="pt-4 pb-1 text-[11px] uppercase tracking-wider font-semibold text-primary"
          >
            {group.heading}
          </td>
        </tr>
      )}
      {group.rows.map((r, i) => (
        <tr
          key={i}
          className={cn(
            "border-b border-border/50 last:border-0",
            r.total && "border-t-2 border-border-strong",
          )}
        >
          <td
            className={cn("py-1.5", r.bold && "font-semibold")}
            style={{ paddingLeft: (r.indent ?? 0) * 16 }}
          >
            {r.label}
            {r.noteNo ? <NoteRef n={r.noteNo} /> : null}
          </td>
          <td className={cn("py-1.5 text-right mono tabular-nums", r.bold && "font-semibold")}>
            {FMT(r.value)}
          </td>
          {hasPrior && (
            <td className="py-1.5 text-right mono tabular-nums text-muted-foreground">
              {CELL(r.prior)}
            </td>
          )}
        </tr>
      ))}
    </>
  );
}

/** Convert a balance-sheet section into comparative rows (prior matched by label). */
function toRows(
  items: BalanceSheetItem[],
  priorItems: BalanceSheetItem[] | null,
  noteFor?: (label: string) => number | undefined,
): ComparativeRow[] {
  return items.map((it) => ({
    label: it.label,
    value: it.value,
    prior: priorItems ? priorItems.find((p) => p.label === it.label)?.value ?? 0 : null,
    noteNo: noteFor?.(it.label),
  }));
}

export default function AuditedStatementsPage() {
  const [year, setYear] = useState<number>(defaultYear());
  const company = useOrgSettings((s) => s.company);
  const citSetting = useOrgSettings((s) => s.taxConfig.citClassification);
  const { generated } = useFilingHistory();
  const record = generated[year];
  const stale = record ? filingRepository.isStale(year) : false;

  const bsInputsFor = useCallback((y: number): BSInputs => {
    const ob = selectOpeningBalance(y);
    return {
      shareCapital: ob.shareCapital,
      retainedEarningsBF: ob.retainedEarningsBF,
      openingCash: ob.openingCash,
      disposalProceeds: 0,
      capitalIntroduced: 0,
      loanProceeds: 0,
      loanRepayment: 0,
      dividendsPaid: 0,
    };
  }, []);

  const classification = useMemo(() => resolveClassification(year, citSetting), [year, citSetting]);
  const pnl = useMemo(() => pnlFor(year), [year]);
  const pnlPrior = useMemo(() => pnlFor(year - 1), [year]);
  const hasPrior = pnlPrior.hasData;

  const bs = useMemo(() => computeBalanceSheet(year, bsInputsFor(year)), [year, bsInputsFor]);
  const bsPrior: BalanceSheetStatement | null = useMemo(
    () => (pnlPrior.hasData ? computeBalanceSheet(year - 1, bsInputsFor(year - 1)) : null),
    [year, pnlPrior.hasData, bsInputsFor],
  );
  const cf = useMemo(() => {
    const ob = selectOpeningBalance(year);
    return computeCashFlow(year, {
      openingCash: ob.openingCash,
      disposalProceeds: 0,
      capitalIntroduced: 0,
      loanProceeds: 0,
      loanRepayment: 0,
      dividendsPaid: 0,
    });
  }, [year]);
  const socie = useMemo(() => {
    const ob = selectOpeningBalance(year);
    return computeChangesInEquity(year, {
      shareCapital: ob.shareCapital,
      retainedEarningsBF: ob.retainedEarningsBF,
      dividendsPaid: 0,
    });
  }, [year]);
  const notes = useMemo(() => computeNotes(year), [year]);
  const valueAdded = useMemo(() => computeValueAdded(year, { dividendsPaid: 0 }), [year]);
  const finSummary = useMemo(() => computeFinancialSummary(year, bsInputsFor), [year, bsInputsFor]);

  // ── 1. SOFP groups ─────────────────────────────────────────────────────────
  const sofpGroups = useMemo(() => {
    const ncaNote = (l: string) => (l === "Net Book Value" ? 4 : undefined);
    const caNote = (l: string) => (l.includes("Receivable") ? 5 : undefined);
    const clNote = (l: string) =>
      l.includes("Payable") && !/VAT|WHT|PAYE|CIT/.test(l) ? 6 : undefined;
    return [
      {
        heading: "Non-Current Assets",
        rows: [
          ...toRows(bs.assets.nonCurrentAssets.items, bsPrior?.assets.nonCurrentAssets.items ?? null, ncaNote),
          { label: "Total Non-Current Assets", value: bs.assets.nonCurrentAssets.subtotal, prior: bsPrior?.assets.nonCurrentAssets.subtotal ?? null, bold: true, total: true },
        ],
      },
      {
        heading: "Current Assets",
        rows: [
          ...toRows(bs.assets.currentAssets.items, bsPrior?.assets.currentAssets.items ?? null, caNote),
          { label: "Total Current Assets", value: bs.assets.currentAssets.subtotal, prior: bsPrior?.assets.currentAssets.subtotal ?? null, bold: true, total: true },
          { label: "TOTAL ASSETS", value: bs.assets.totalAssets, prior: bsPrior?.assets.totalAssets ?? null, bold: true, total: true },
        ],
      },
      {
        heading: "Current Liabilities",
        rows: [
          ...toRows(bs.liabilities.currentLiabilities.items, bsPrior?.liabilities.currentLiabilities.items ?? null, clNote),
          { label: "Total Liabilities", value: bs.liabilities.totalLiabilities, prior: bsPrior?.liabilities.totalLiabilities ?? null, bold: true, total: true },
        ],
      },
      {
        heading: "Equity",
        rows: [
          ...toRows(bs.equity.items, bsPrior?.equity.items ?? null),
          { label: "Total Equity", value: bs.equity.totalEquity, prior: bsPrior?.equity.totalEquity ?? null, bold: true, total: true },
          { label: "TOTAL LIABILITIES & EQUITY", value: bs.totalLiabilitiesAndEquity, prior: bsPrior?.totalLiabilitiesAndEquity ?? null, bold: true, total: true },
        ],
      },
    ];
  }, [bs, bsPrior]);

  // ── 2. SOCI rows ───────────────────────────────────────────────────────────
  const sociRows: ComparativeRow[] = [
    { label: "Revenue", value: pnl.revenue, prior: hasPrior ? pnlPrior.revenue : null, noteNo: 1 },
    { label: "Cost of sales", value: -pnl.costOfSales, prior: hasPrior ? -pnlPrior.costOfSales : null, noteNo: 2 },
    { label: "Gross profit", value: pnl.grossProfit, prior: hasPrior ? pnlPrior.grossProfit : null, bold: true, total: true },
    { label: "Operating expenses", value: -pnl.expenses, prior: hasPrior ? -pnlPrior.expenses : null, noteNo: 3 },
    { label: "Profit / (loss) before taxation", value: pnl.pbt, prior: hasPrior ? pnlPrior.pbt : null, bold: true, total: true },
    { label: "Company income tax", value: -pnl.citPayable, prior: hasPrior ? -pnlPrior.citPayable : null, noteNo: 7, indent: 1 },
    { label: "Development levy", value: -pnl.developmentLevy, prior: hasPrior ? -pnlPrior.developmentLevy : null, noteNo: 7, indent: 1 },
    { label: "Profit / (loss) for the year", value: pnl.pat, prior: hasPrior ? pnlPrior.pat : null, bold: true, total: true },
  ];

  const markGenerated = () => {
    filingRepository.recordGeneration(year);
    toast.success(`AFS for FY ${year} recorded in generation history.`);
  };

  return (
    <AppShell title="Audited Financial Statement">
      <div className="p-6 space-y-6 max-w-[1100px] w-full mx-auto">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Filing & Documentation
            </div>
            <h1 className="text-xl font-semibold mt-1">Audited Financial Statement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Seven-part statutory account pack · FY {year} · {classification} Company
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilingYearSelect value={year} onChange={setYear} />
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
            <Button onClick={markGenerated}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark as Generated
            </Button>
          </div>
        </header>

        {/* Unsigned-draft framing */}
        <div className="cl-card border border-warning/40 bg-warning/10 p-4 text-[13px] flex gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
          <p>
            <span className="font-semibold">Unsigned draft.</span> Core Ledger prepares this pack
            unsigned. It becomes an Audited Financial Statement only after an independent,
            ICAN-licensed auditor reviews and signs it — that sign-off happens entirely outside
            this platform.
            {record && (
              <span className="block mt-1 text-muted-foreground">
                Recorded as generated on {formatDate(record.generatedAt)} (v{record.version})
                {stale && (
                  <span className="text-warning font-medium">
                    {" "}— underlying data has changed since; review before use.
                  </span>
                )}
              </span>
            )}
          </p>
        </div>

        {/* Document header */}
        <PageCard className="text-center">
          <div className="py-4">
            <div className="text-lg font-semibold tracking-tight">{company.name}</div>
            <div className="text-[12px] text-muted-foreground">
              RC {company.registrationNumber} · {company.address}
            </div>
            <div className="mt-2 text-[15px] font-semibold">
              Audited Financial Statements
            </div>
            <div className="text-[12px] text-muted-foreground">
              For the year ended 31 December {year}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Tag tone="warning">Unsigned Draft</Tag>
              <Tag tone="primary">{classification} Company</Tag>
            </div>
          </div>
        </PageCard>

        {/* 1 — SOFP */}
        <PageCard title={`1. Statement of Financial Position — As at 31 December ${year}`}>
          <CompTable groups={sofpGroups} year={year} hasPrior={hasPrior && bsPrior !== null} />
        </PageCard>

        {/* 2 — SOCI */}
        <PageCard title={`2. Statement of Comprehensive Income — Year ended 31 December ${year}`}>
          <CompTable groups={[{ rows: sociRows }]} year={year} hasPrior={hasPrior} />
        </PageCard>

        {/* 3 — SOCIE */}
        <PageCard title={`3. Statement of Changes in Equity — Year ended 31 December ${year}`}>
          <SocieTable rows={socie.rows} />
          {socie.hasPrior && (
            <>
              <div className="mt-5 mb-2 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Comparative — Year ended 31 December {year - 1}
              </div>
              <SocieTable rows={socie.priorRows} />
            </>
          )}
        </PageCard>

        {/* 4 — Cash Flow */}
        <PageCard title={`4. Cash Flow Statement — Year ended 31 December ${year}`}>
          {cf.sections.map((s) => (
            <div key={s.title}>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-primary mt-3 mb-1">
                {s.title}
              </div>
              <table className="w-full text-[13px]">
                <tbody>
                  {s.items.map((it, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5" style={{ paddingLeft: 16 }}>{it.label}</td>
                      <td className="py-1.5 text-right mono tabular-nums w-40">{FMT(it.value)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border-strong">
                      <td className="py-1.5 font-semibold">Net cash from {s.title.toLowerCase()}</td>
                      <td className="py-1.5 text-right mono tabular-nums font-semibold">{FMT(s.subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
          <table className="w-full text-[13px] mt-4">
            <tbody>
              <tr>
                <td className="py-1.5 font-semibold">Net increase / (decrease) in cash</td>
                <td className="py-1.5 text-right mono tabular-nums font-semibold w-40">{FMT(cf.netChange)}</td>
              </tr>
              <tr>
                <td className="py-1.5">Cash & cash equivalents at 1 January {year}</td>
                <td className="py-1.5 text-right mono tabular-nums">{FMT(cf.openingCash)}</td>
              </tr>
              <tr className="border-t-2 border-border-strong">
                <td className="py-2 text-[15px] font-semibold">Cash & cash equivalents at 31 December {year}</td>
                <td className="py-2 text-right mono tabular-nums text-[15px] font-semibold">{FMT(cf.closingCash)}</td>
              </tr>
            </tbody>
          </table>
        </PageCard>

        {/* 5 — Notes */}
        <PageCard title="5. Notes to the Accounts">
          <div className="space-y-8">
            {notes.map((n) => (
              <div key={n.no}>
                <h3 className="text-[14px] font-semibold text-foreground">
                  Note {n.no} — {n.title}
                </h3>
                {n.narrative && (
                  <p className="text-[12px] text-muted-foreground mt-1 mb-2">{n.narrative}</p>
                )}
                <CompTable groups={[{ rows: n.rows }]} year={year} hasPrior={hasPrior} />
              </div>
            ))}
          </div>
        </PageCard>

        {/* 6 — Value Added */}
        <PageCard title={`6. Statement of Value Added — Year ended 31 December ${year}`}>
          <ValueAddedTable title="Value Applied" lines={valueAdded.applied} year={year} hasPrior={valueAdded.hasPrior} />
          <div className="mt-6">
            <ValueAddedTable title="Value Distributed" lines={valueAdded.distributed} year={year} hasPrior={valueAdded.hasPrior} />
          </div>
        </PageCard>

        {/* 7 — Financial Summary */}
        <PageCard title="7. Financial Summary — Five-Year">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 font-semibold">Particulars</th>
                {finSummary.years.map((y) => (
                  <th key={y} className="py-2 font-semibold text-right w-32">FY {y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-1.5 text-muted-foreground">Company classification</td>
                {finSummary.bands.map((b, i) => (
                  <td key={i} className="py-1.5 text-right">
                    {b === "—" ? <span className="text-muted-foreground">—</span> : <Tag tone="muted">{b}</Tag>}
                  </td>
                ))}
              </tr>
              {finSummary.rows.map((r, i) => (
                <tr key={i} className={cn("border-b border-border/50 last:border-0", r.bold && "border-t-2 border-border-strong")}>
                  <td className={cn("py-1.5", r.bold && "font-semibold")}>{r.label}</td>
                  {r.values.map((v, vi) => (
                    <td key={vi} className={cn("py-1.5 text-right mono tabular-nums", r.bold && "font-semibold")}>
                      {FMT(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </PageCard>

        {/* Board approval / signature block */}
        <PageCard title="Approval of the Financial Statements">
          <p className="text-[13px] text-muted-foreground mb-6">
            The financial statements on pages 1 to 7 were approved by the Board of Directors and
            signed on its behalf by:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {["Director", "Director / Company Secretary"].map((role) => (
              <div key={role} className="space-y-6">
                <div className="border-b border-border-strong pb-1 text-[12px] text-muted-foreground">
                  Signature
                </div>
                <div className="border-b border-border-strong pb-1 text-[12px] text-muted-foreground">
                  Full name
                </div>
                <div className="flex items-end justify-between gap-4">
                  <span className="text-[13px] font-medium">{role}</span>
                  <div className="border-b border-border-strong pb-1 w-28 text-[12px] text-muted-foreground">
                    Date
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </AppShell>
  );
}

function SocieTable({ rows }: { rows: ChangesInEquityRow[] }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <th className="py-2 font-semibold">Particulars</th>
          <th className="py-2 font-semibold text-right w-36">Share Capital (₦)</th>
          <th className="py-2 font-semibold text-right w-36">Retained Earnings (₦)</th>
          <th className="py-2 font-semibold text-right w-36">Total Equity (₦)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            className={cn(
              "border-b border-border/50 last:border-0",
              r.isTotal && "border-t-2 border-border-strong",
            )}
          >
            <td className={cn("py-1.5", r.bold && "font-semibold")}>{r.label}</td>
            <td className={cn("py-1.5 text-right mono tabular-nums", r.bold && "font-semibold")}>
              {r.shareCapital === null ? "—" : FMT(r.shareCapital)}
            </td>
            <td className={cn("py-1.5 text-right mono tabular-nums", r.bold && "font-semibold")}>
              {r.retainedEarnings === null ? "—" : FMT(r.retainedEarnings)}
            </td>
            <td className={cn("py-1.5 text-right mono tabular-nums", r.bold && "font-semibold")}>
              {FMT(r.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ValueAddedTable({
  title, lines, year, hasPrior,
}: {
  title: string;
  lines: ValueAddedLine[];
  year: number;
  hasPrior: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">
        {title}
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="py-2 font-semibold">Particulars</th>
            <th className="py-2 font-semibold text-right w-32">FY {year} (₦)</th>
            <th className="py-2 font-semibold text-right w-16">%</th>
            {hasPrior && <th className="py-2 font-semibold text-right w-32">FY {year - 1} (₦)</th>}
            {hasPrior && <th className="py-2 font-semibold text-right w-16">%</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-border/50 last:border-0",
                l.total && "border-t-2 border-border-strong",
              )}
            >
              <td
                className={cn("py-1.5", l.bold && "font-semibold")}
                style={{ paddingLeft: (l.indent ?? 0) * 16 }}
              >
                {l.label}
                {l.noteRef ? <NoteRef n={1} /> : null}
              </td>
              <td className={cn("py-1.5 text-right mono tabular-nums", l.bold && "font-semibold")}>
                {FMT(l.value)}
              </td>
              <td className="py-1.5 text-right mono tabular-nums text-muted-foreground">
                {l.pct !== undefined ? l.pct.toFixed(1) : ""}
              </td>
              {hasPrior && (
                <td className="py-1.5 text-right mono tabular-nums text-muted-foreground">
                  {CELL(l.prior)}
                </td>
              )}
              {hasPrior && (
                <td className="py-1.5 text-right mono tabular-nums text-muted-foreground">
                  {l.priorPct !== undefined ? l.priorPct.toFixed(1) : ""}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

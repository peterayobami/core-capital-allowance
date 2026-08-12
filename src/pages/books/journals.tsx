import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportKpi, ReportKpiStrip, PageCard, Tag } from "@/components/reports/ReportPrimitives";
import { YearSelect, PeriodSelect, periodLabel } from "@/components/reports/PeriodFilter";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronRight, BookOpen, FileCheck2, FileClock, ShieldCheck, Scale, Printer, ChevronLeft,
} from "lucide-react";
import { generateJournals } from "@/lib/services/ledger.service";
import { defaultYear, inPeriod, type Period } from "@/lib/services/tax.service";
import type { JournalEntry, JournalSource } from "@/lib/models/ledger";
import { formatNGN, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Cell,
} from "recharts";

const SOURCE_FILTERS: Array<{ value: "all" | JournalSource; label: string }> = [
  { value: "all", label: "All Sources" },
  { value: "Revenue", label: "Revenue" },
  { value: "Purchase", label: "Purchase" },
  { value: "Expense", label: "Expense" },
  { value: "Asset", label: "Asset" },
  { value: "Depreciation", label: "Depreciation" },
  { value: "Manual", label: "Manual" },
];

const SOURCE_TONE: Record<JournalSource, "primary" | "success" | "warning" | "skyblue" | "purple" | "muted"> = {
  Revenue: "success",
  Purchase: "warning",
  Expense: "warning",
  Asset: "skyblue",
  Depreciation: "purple",
  Payroll: "primary",
  Manual: "muted",
};

export default function JournalsPage() {
  const [year, setYear] = useState<number>(defaultYear());
  const [period, setPeriod] = useState<Period>("full");
  const [source, setSource] = useState<"all" | JournalSource>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // 🔌 BACKEND: Replace with `GET /api/journals?year=&period=&source=`.
  const journals = useMemo(() => generateJournals(year, period), [year, period]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return journals.filter(j => {
      if (source !== "all" && j.source !== source) return false;
      if (!q) return true;
      return (
        j.reference.toLowerCase().includes(q) ||
        j.narration.toLowerCase().includes(q) ||
        j.lines.some(l => l.accountCode.includes(q) || l.accountName.toLowerCase().includes(q))
      );
    });
  }, [journals, source, search]);

  // 🔌 BACKEND: status counts will come from `GET /api/journals?...&groupBy=status`.
  const totalEntries = filtered.length;
  const postedCount = filtered.filter(j => j.status === "Posted").length;
  const draftCount = filtered.filter(j => j.status === "Draft").length;
  const unbalancedCount = filtered.filter(j =>
    j.status === "Posted" && Math.abs(j.totalDebit - j.totalCredit) >= 1).length;
  const balanced = unbalancedCount === 0;

  const totalDr = filtered.reduce((s, j) => s + j.totalDebit, 0);
  const totalCr = filtered.reduce((s, j) => s + j.totalCredit, 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  // Reset to first page when filters change
  useEffect(() => { setPage(1); }, [year, period, source, search, pageSize]);

  // Monthly volume — count of entries per month, dimmed if outside selected period
  const yearJournals = useMemo(() => generateJournals(year, "full"), [year]);
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const volume = MONTHS.map((label, i) => {
    const m = i + 1;
    const count = yearJournals.filter(j => new Date(j.date).getMonth() + 1 === m).length;
    const inSel = inPeriod(`${year}-${String(m).padStart(2, "0")}-15`, year, period);
    return { month: label, count, inSel };
  });

  return (
    <AppShell title="Journals">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Books</div>
            <h1 className="text-xl font-semibold mt-1">Journals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Auto-generated ledger entries — {periodLabel(year, period)}.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <YearSelect value={year} onChange={setYear} />
            <PeriodSelect value={period} onChange={setPeriod} />
            <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
              <Printer className="h-4 w-4 mr-1.5" /> Export
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <ReportKpiStrip>
          <ReportKpi label="Total Entries" value={totalEntries.toString()}
            hint="All entries in period" icon={BookOpen} tone="primary" />
          <ReportKpi label="Posted" value={postedCount.toString()}
            hint="Approved & posted" icon={FileCheck2} tone="success" />
          <ReportKpi label="Draft / Unposted" value={draftCount.toString()}
            hint="Pending approval" icon={FileClock} tone="warning" />
          <ReportKpi label="Balanced Check"
            value={balanced ? "✓ Balanced" : `⚠ ${unbalancedCount} Unbalanced`}
            hint={balanced ? "Every posted entry: Dr = Cr" : "Posted entries with Dr ≠ Cr"}
            icon={balanced ? ShieldCheck : Scale}
            tone={balanced ? "success" : "danger"} />
        </ReportKpiStrip>

        {/* Monthly volume chart */}
        <PageCard title="Entry Volume by Month">
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={volume} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RTooltip
                  cursor={{ fill: "hsl(var(--secondary))" }}
                  formatter={(v: number) => [`${v} entries`, "Count"]}
                />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {volume.map((v, i) => (
                    <Cell key={i} fill="hsl(var(--primary))" fillOpacity={v.inSel ? 1 : 0.25} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PageCard>

        {/* Filters */}
        <PageCard>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search reference, narration, account…" />
            <Select value={source} onValueChange={(v) => setSource(v as "all" | JournalSource)}>
              <SelectTrigger className="h-9 w-[180px] text-sm bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_FILTERS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-[12px] text-muted-foreground">
              Showing{" "}
              <span className="mono font-semibold text-foreground">
                {filtered.length === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + pageSize, filtered.length)}
              </span>{" "}
              of <span className="mono">{filtered.length}</span> entries
            </span>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No journal entries match the current filters.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {paginated.map(j => (
                  <JournalRow key={j.id} entry={j} />
                ))}
              </div>

              {/* Period totals (Dr/Cr footer) */}
              <div className="mt-3 grid grid-cols-12 items-center gap-3 px-3 py-2 rounded-lg bg-secondary/40 border border-border-strong text-[12.5px] font-semibold">
                <span className="col-span-9 text-right text-muted-foreground">Period Totals</span>
                <span className="col-span-3 text-right">
                  <span className="text-muted-foreground mr-2">Dr</span>
                  <span className="mono">{formatNGN(totalDr)}</span>
                  <span className="text-muted-foreground mx-2">·</span>
                  <span className="text-muted-foreground mr-2">Cr</span>
                  <span className="mono">{formatNGN(totalCr)}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <span>Rows per page</span>
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="h-8 w-[72px] text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="px-3 text-[12px] text-muted-foreground mono">
                    Page <span className="text-foreground font-semibold">{currentPage}</span> of{" "}
                    <span className="text-foreground font-semibold">{totalPages}</span>
                  </span>
                  <Button
                    variant="outline" size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </PageCard>
      </div>
    </AppShell>
  );
}

function JournalRow({ entry }: { entry: JournalEntry }) {
  const [open, setOpen] = useState(false);
  const tone = SOURCE_TONE[entry.source];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full grid grid-cols-12 items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-secondary/40 transition-colors text-left">
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform col-span-1", open && "rotate-90")} />
          <span className="mono text-[12px] text-muted-foreground col-span-2">{entry.reference}</span>
          <span className="mono text-[12px] text-foreground col-span-1">{formatDate(entry.date)}</span>
          <span className="text-[13px] truncate col-span-5">{entry.narration}</span>
          <span className="col-span-1"><Tag tone={tone}>{entry.source}</Tag></span>
          <span className="mono text-[12px] text-right col-span-2 font-semibold">
            {formatNGN(entry.totalDebit)}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="overflow-x-auto mt-1 mx-3 mb-3">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[80px]">Code</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Account</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Description</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground fig">Debit</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground fig">Credit</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map(l => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="py-1.5 px-3 mono">{l.accountCode}</td>
                  <td className="py-1.5 px-3">{l.accountName}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{l.description ?? "—"}</td>
                  <td className="py-1.5 px-3 mono text-right">{l.debit > 0 ? formatNGN(l.debit) : "—"}</td>
                  <td className="py-1.5 px-3 mono text-right">{l.credit > 0 ? formatNGN(l.credit) : "—"}</td>
                </tr>
              ))}
              <tr className="border-t border-border-strong bg-secondary/40">
                <td colSpan={3} className="py-2 px-3 font-semibold text-right">Totals</td>
                <td className="py-2 px-3 mono font-semibold text-right">{formatNGN(entry.totalDebit)}</td>
                <td className="py-2 px-3 mono font-semibold text-right">{formatNGN(entry.totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

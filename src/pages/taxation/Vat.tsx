import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportKpi, ReportKpiStrip, PageCard, StatementRow, SectionHeading, Tag }
  from "@/components/reports/ReportPrimitives";
import { YearSelect, PeriodSelect, periodLabel } from "@/components/reports/PeriodFilter";
import {
  defaultYear, type Period,
  vatTotals, vatTransactionsIn, revenuesIn, aggregateMonthly,
} from "@/lib/services/tax.service";
import { formatNGN } from "@/lib/utils/format";
import { Receipt, ShoppingCart, BadgeDollarSign, Hash, Search, FileDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Legend, Line, ComposedChart,
} from "recharts";

export default function VatPage() {
  const [year, setYear] = useState<number>(defaultYear());
  const [period, setPeriod] = useState<Period>("full");

  const totals = useMemo(() => vatTotals(year, period), [year, period]);
  const monthly = useMemo(() => aggregateMonthly(year), [year]);

  const isPayable = totals.netVat >= 0;

  return (
    <AppShell title="VAT Computation">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Taxation</div>
            <h1 className="text-xl font-semibold mt-1">VAT Computation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Net VAT position for {periodLabel(year, period)} — Output VAT minus recoverable Input VAT.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <YearSelect value={year} onChange={setYear} />
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
        </header>

        <ReportKpiStrip>
          <ReportKpi label="Output VAT (Sales)" value={formatNGN(totals.outputVat)}
            hint="From taxable revenue invoices" icon={Receipt} tone="success" />
          <ReportKpi label="Input VAT (Purchases)" value={formatNGN(totals.inputVat)}
            hint="Recoverable from purchases & expenses" icon={ShoppingCart} tone="primary" />
          <ReportKpi
            label={isPayable ? "Net VAT Payable" : "Net VAT Refundable"}
            value={formatNGN(Math.abs(totals.netVat))}
            hint={isPayable ? "Payable to FIRS" : "Refundable from FIRS"}
            icon={BadgeDollarSign}
            tone={isPayable ? "warning" : "skyblue"}
          />
          <ReportKpi
            label="Taxable Transactions"
            value={totals.taxableTxnCount.toLocaleString()}
            hint={`Out of ${totals.totalTxnCount} total transactions`}
            icon={Hash}
            tone="purple"
          />
        </ReportKpiStrip>

        {/* Monthly chart */}
        <PageCard title="Monthly VAT Trend">
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={monthly} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                <RTooltip content={<MoneyTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="outputVat" name="Output VAT" fill="hsl(var(--success))" radius={[4,4,0,0]} />
                <Bar yAxisId="left" dataKey="inputVat" name="Input VAT" fill="hsl(var(--primary))" fillOpacity={0.8} radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="netVat" name="Net VAT" stroke="hsl(var(--warning))" strokeDasharray="5 4" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </PageCard>

        {/* Statement */}
        <PageCard
          title="VAT Computation Statement"
          action={
            <button
              onClick={() => toast.info("PDF export coming soon")}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-secondary"
            >
              <FileDown className="h-4 w-4" /> Download as PDF
            </button>
          }
        >
          <div className="text-center mb-3">
            <div className="text-[13px] font-semibold tracking-wider uppercase text-primary">VAT Computation</div>
            <div className="text-xs text-muted-foreground">For the period ended {periodLabel(year, period)}</div>
          </div>

          <SectionHeading>Output Tax</SectionHeading>
          <StatementRow label="Total Taxable Sales (Revenue)" value={formatNGN(totals.taxableSales)} muted />
          <StatementRow label="Output VAT @ 7.5%" value={formatNGN(totals.outputVat)} bold total />

          <SectionHeading>Input Tax</SectionHeading>
          <StatementRow label="Total VAT-Eligible Purchases" value={formatNGN(totals.purchasesVatBase)} muted />
          <StatementRow label="Input VAT @ 7.5% (Purchases)" value={formatNGN(totals.purchasesInputVat)} />
          <StatementRow label="Total VAT-Eligible Expenses" value={formatNGN(totals.expensesVatBase)} muted />
          <StatementRow label="Input VAT @ 7.5% (Expenses)" value={formatNGN(totals.expensesInputVat)} />
          <StatementRow label="Total Input VAT" value={formatNGN(totals.inputVat)} bold total />

          <div className={
            "mt-3 flex items-center justify-between rounded-lg px-4 py-3 " +
            (isPayable ? "bg-warning/10" : "bg-sky-100")
          }>
            <span className="text-[13px] font-semibold uppercase tracking-wider">
              {isPayable ? "Net VAT Payable" : "Net VAT Refundable"}
            </span>
            <span className={
              "mono text-[18px] font-bold " +
              (isPayable ? "text-warning" : "text-sky-700")
            }>
              {formatNGN(Math.abs(totals.netVat))}
            </span>
          </div>
        </PageCard>

        {/* Tabs */}
        <PageCard title="Transaction Breakdown">
          <Tabs defaultValue="output">
            <TabsList>
              <TabsTrigger value="output">Output VAT Transactions</TabsTrigger>
              <TabsTrigger value="input">Input VAT Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="output" className="mt-4">
              <OutputVatTable year={year} period={period} />
            </TabsContent>
            <TabsContent value="input" className="mt-4">
              <InputVatTable year={year} period={period} />
            </TabsContent>
          </Tabs>
        </PageCard>
      </div>
    </AppShell>
  );
}

// ──────────────────────────── Tables ────────────────────────────
function OutputVatTable({ year, period }: { year: number; period: Period }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const PAGE = 10;
  const all = useMemo(() => revenuesIn(year, period).filter(r => r.isTaxableSupply), [year, period]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter(r => r.description.toLowerCase().includes(s) || r.invoiceNo.toLowerCase().includes(s));
  }, [all, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div>
      <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search description or invoice…" />
      <div className="overflow-x-auto">
        <table className="data-table w-full text-[13px]">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left" style={{ width: 110 }}>Date</th>
              <th className="px-3 py-2 text-left" style={{ width: 180 }}>Invoice #</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left" style={{ width: 200 }}>Customer</th>
              <th className="px-3 py-2 text-right" style={{ width: 140 }}>Sales Amount</th>
              <th className="px-3 py-2 text-right" style={{ width: 130 }}>Output VAT</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No transactions in this period.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-3 py-2 mono text-muted-foreground">{fmtDate(r.date)}</td>
                <td className="px-3 py-2 mono">{r.invoiceNo}</td>
                <td className="px-3 py-2 truncate max-w-[24ch]">{r.description}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.customer}</td>
                <td className="px-3 py-2 mono text-right">{formatNGN(r.sales)}</td>
                <td className="px-3 py-2 mono text-right text-success font-medium">{formatNGN(r.vatAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={setPage} total={filtered.length} />
    </div>
  );
}

function InputVatTable({ year, period }: { year: number; period: Period }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const PAGE = 10;
  const all = useMemo(() => vatTransactionsIn(year, period), [year, period]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter(t => t.description.toLowerCase().includes(s) || t.invoiceNumber.toLowerCase().includes(s));
  }, [all, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div>
      <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search description or invoice…" />
      <div className="overflow-x-auto">
        <table className="data-table w-full text-[13px]">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left" style={{ width: 110 }}>Date</th>
              <th className="px-3 py-2 text-left" style={{ width: 180 }}>Invoice #</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left" style={{ width: 200 }}>Supplier/Vendor</th>
              <th className="px-3 py-2 text-left" style={{ width: 110 }}>Type</th>
              <th className="px-3 py-2 text-right" style={{ width: 140 }}>Amount</th>
              <th className="px-3 py-2 text-right" style={{ width: 130 }}>Input VAT</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No transactions in this period.</td></tr>
            )}
            {rows.map(t => (
              <tr key={`${t.sourceType}-${t.id}`}>
                <td className="px-3 py-2 mono text-muted-foreground">{fmtDate(t.date)}</td>
                <td className="px-3 py-2 mono">{t.invoiceNumber}</td>
                <td className="px-3 py-2 truncate max-w-[24ch]">{t.description}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.partyName}</td>
                <td className="px-3 py-2">
                  <Tag tone={t.sourceType === "Purchase" ? "skyblue" : "warning"}>{t.sourceType}</Tag>
                </td>
                <td className="px-3 py-2 mono text-right">{formatNGN(t.amount)}</td>
                <td className="px-3 py-2 mono text-right text-primary font-medium">{formatNGN(t.inputVat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={setPage} total={filtered.length} />
    </div>
  );
}

// ──────────────────────────── Helpers ────────────────────────────
function SearchBar({ value, onChange, placeholder }:
  { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-lg border border-border bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}

function Pager({ page, pages, onPage, total }:
  { page: number; pages: number; onPage: (p: number) => void; total: number }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between text-[12px] text-muted-foreground mt-3">
      <span>Page {page} of {pages} · {total.toLocaleString()} records</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}
          className="px-3 py-1 rounded border border-border bg-card disabled:opacity-50 hover:bg-secondary">Prev</button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)}
          className="px-3 py-1 rounded border border-border bg-card disabled:opacity-50 hover:bg-secondary">Next</button>
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function abbr(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a >= 1e9) return `${sign}₦${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${sign}₦${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}₦${(a / 1e3).toFixed(0)}K`;
  return `${sign}₦${a.toFixed(0)}`;
}

export function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card shadow-md px-3 py-2 text-[12px]">
      <div className="font-semibold mb-1 text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </span>
          <span className="mono font-medium">{formatNGN(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportKpi, ReportKpiStrip, PageCard, StatementRow, SectionHeading, Tag }
  from "@/components/reports/ReportPrimitives";
import { YearSelect, PeriodSelect, periodLabel } from "@/components/reports/PeriodFilter";
import {
  defaultYear, type Period,
  whtTotals, whtPayableTransactionsIn, revenuesIn, aggregateMonthly,
} from "@/lib/services/tax.service";
import { formatNGN } from "@/lib/utils/format";
import {
  ArrowDownLeft, ArrowUpRight, Scale, FileCheck2, Search, FileDown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Legend, Line, ReferenceLine,
} from "recharts";
import { abbr, MoneyTooltip } from "./Vat";

export default function WhtPage() {
  const [year, setYear] = useState<number>(defaultYear());
  const [period, setPeriod] = useState<Period>("full");

  const totals = useMemo(() => whtTotals(year, period), [year, period]);
  const monthly = useMemo(() => aggregateMonthly(year), [year]);

  const isCredit = totals.netPosition >= 0;

  return (
    <AppShell title="WHT">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Taxation</div>
            <h1 className="text-xl font-semibold mt-1">Withholding Tax (WHT)</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              WHT receivable as credits and WHT payable to FIRS for {periodLabel(year, period)}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <YearSelect value={year} onChange={setYear} />
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
        </header>

        <ReportKpiStrip>
          <ReportKpi label="WHT Receivable" value={formatNGN(totals.receivable)}
            hint="Credits from customers" icon={ArrowDownLeft} tone="success" />
          <ReportKpi label="WHT Payable" value={formatNGN(totals.payable)}
            hint="To remit to FIRS" icon={ArrowUpRight} tone="warning" />
          <ReportKpi
            label="Net WHT Position"
            value={formatNGN(Math.abs(totals.netPosition))}
            hint={isCredit ? "Net credit (Receivable − Payable)" : "Net payable to FIRS"}
            icon={Scale}
            tone={isCredit ? "primary" : "danger"}
          />
          <ReportKpi label="WHT Certificates" value={totals.certificates.toLocaleString()}
            hint="Total certificates received" icon={FileCheck2} tone="skyblue" />
        </ReportKpiStrip>

        <PageCard title="Monthly WHT Activity">
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={monthly} stackOffset="sign" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => abbr(v)} />
                <RTooltip content={<MoneyTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--border-strong))" />
                <Bar dataKey="whtReceivable" name="WHT Receivable" fill="hsl(var(--success))" stackId="wht" radius={[4,4,0,0]} />
                <Bar dataKey="whtPayable" name="WHT Payable" fill="hsl(var(--warning))" stackId="wht" radius={[0,0,4,4]} />
                <Line type="monotone" dataKey="whtNet" name="Net Position" stroke="hsl(var(--primary))" strokeDasharray="5 4" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </PageCard>

        <PageCard
          title="WHT Summary Statement"
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
            <div className="text-[13px] font-semibold tracking-wider uppercase text-primary">Withholding Tax Summary</div>
            <div className="text-xs text-muted-foreground">For the period ended {periodLabel(year, period)}</div>
          </div>

          <SectionHeading>WHT Receivable (Credits)</SectionHeading>
          <StatementRow label="Total WHT-Applicable Revenue" value={formatNGN(totals.receivableBase)} muted />
          <StatementRow label="WHT Receivable (Total)" value={formatNGN(totals.receivable)} bold />
          <StatementRow label="— of which @ 5%" value={formatNGN(totals.receivable5)} muted indent={1} />
          <StatementRow label="— of which @ 10%" value={formatNGN(totals.receivable10)} muted indent={1} />

          <SectionHeading>WHT Payable (Deducted from Vendors)</SectionHeading>
          <StatementRow label="From Purchases" value={formatNGN(totals.payableFromPurchases)} muted />
          <StatementRow label="From Expenses" value={formatNGN(totals.payableFromExpenses)} muted />
          <StatementRow label="Total WHT Payable" value={formatNGN(totals.payable)} bold total />
          <StatementRow label="— of which @ 5%" value={formatNGN(totals.payable5)} muted indent={1} />
          <StatementRow label="— of which @ 10%" value={formatNGN(totals.payable10)} muted indent={1} />

          <div className={
            "mt-3 flex items-center justify-between rounded-lg px-4 py-3 " +
            (isCredit ? "bg-success/10" : "bg-danger/10")
          }>
            <span className="text-[13px] font-semibold uppercase tracking-wider">Net WHT Position</span>
            <span className={
              "mono text-[18px] font-bold " +
              (isCredit ? "text-success" : "text-danger")
            }>
              {formatNGN(Math.abs(totals.netPosition))}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-right">
            Positive = net credit against CIT · Negative = net payable to FIRS
          </p>
        </PageCard>

        <PageCard title="Transaction Breakdown">
          <Tabs defaultValue="rec">
            <TabsList>
              <TabsTrigger value="rec">WHT Receivable</TabsTrigger>
              <TabsTrigger value="pay">WHT Payable</TabsTrigger>
            </TabsList>
            <TabsContent value="rec" className="mt-4">
              <WhtReceivableTable year={year} period={period} />
            </TabsContent>
            <TabsContent value="pay" className="mt-4">
              <WhtPayableTable year={year} period={period} />
            </TabsContent>
          </Tabs>
        </PageCard>

        <PageCard title="WHT Certificate Register">
          <p className="text-[12px] text-muted-foreground mb-3">
            Certificates received from customers can be used to offset CIT liability.
          </p>
          <CertificateRegister year={year} period={period} />
        </PageCard>
      </div>
    </AppShell>
  );
}

// ───────── Tables ─────────
function WhtReceivableTable({ year, period }: { year: number; period: Period }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1); const PAGE = 10;
  const all = useMemo(() => revenuesIn(year, period).filter(r => r.isWhtApplicable), [year, period]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? all.filter(r => r.description.toLowerCase().includes(s) || r.invoiceNo.toLowerCase().includes(s)) : all;
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
              <th className="px-3 py-2 text-left" style={{ width: 170 }}>Certificate #</th>
              <th className="px-3 py-2 text-right" style={{ width: 130 }}>Sales</th>
              <th className="px-3 py-2 text-center" style={{ width: 80 }}>Rate</th>
              <th className="px-3 py-2 text-right" style={{ width: 130 }}>WHT Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No WHT receivable records.</td></tr>}
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-3 py-2 mono text-muted-foreground">{fmtDate(r.date)}</td>
                <td className="px-3 py-2 mono">{r.invoiceNo}</td>
                <td className="px-3 py-2 truncate max-w-[24ch]">{r.description}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.customer}</td>
                <td className="px-3 py-2 mono text-muted-foreground">{r.whtCertificateNumber ?? "—"}</td>
                <td className="px-3 py-2 mono text-right">{formatNGN(r.sales)}</td>
                <td className="px-3 py-2 text-center"><Tag tone="skyblue">{r.whtRate}%</Tag></td>
                <td className="px-3 py-2 mono text-right text-success font-semibold">{formatNGN(r.whtAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={setPage} total={filtered.length} />
    </div>
  );
}

function WhtPayableTable({ year, period }: { year: number; period: Period }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1); const PAGE = 10;
  const all = useMemo(() => whtPayableTransactionsIn(year, period), [year, period]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? all.filter(t => t.description.toLowerCase().includes(s) || t.invoiceNumber.toLowerCase().includes(s)) : all;
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
              <th className="px-3 py-2 text-left" style={{ width: 200 }}>Vendor/Supplier</th>
              <th className="px-3 py-2 text-left" style={{ width: 110 }}>Type</th>
              <th className="px-3 py-2 text-right" style={{ width: 130 }}>Amount</th>
              <th className="px-3 py-2 text-center" style={{ width: 80 }}>Rate</th>
              <th className="px-3 py-2 text-right" style={{ width: 130 }}>WHT Deducted</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No WHT payable records.</td></tr>}
            {rows.map(t => (
              <tr key={`${t.sourceType}-${t.id}`}>
                <td className="px-3 py-2 mono text-muted-foreground">{fmtDate(t.date)}</td>
                <td className="px-3 py-2 mono">{t.invoiceNumber}</td>
                <td className="px-3 py-2 truncate max-w-[24ch]">{t.description}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.vendorName}</td>
                <td className="px-3 py-2"><Tag tone={t.sourceType === "Purchase" ? "skyblue" : "warning"}>{t.sourceType}</Tag></td>
                <td className="px-3 py-2 mono text-right">{formatNGN(t.amount)}</td>
                <td className="px-3 py-2 text-center"><Tag tone="muted">{t.whtRate}%</Tag></td>
                <td className="px-3 py-2 mono text-right text-warning font-semibold">{formatNGN(t.whtAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={setPage} total={filtered.length} />
    </div>
  );
}

function CertificateRegister({ year, period }: { year: number; period: Period }) {
  const rows = useMemo(
    () => revenuesIn(year, period).filter(r => r.isWhtApplicable && r.whtCertificateNumber),
    [year, period],
  );
  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full text-[13px]">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left">Certificate #</th>
            <th className="px-3 py-2 text-left">Customer</th>
            <th className="px-3 py-2 text-left">Issue Date</th>
            <th className="px-3 py-2 text-left">Invoice #</th>
            <th className="px-3 py-2 text-right">WHT Amount</th>
            <th className="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No certificates available.</td></tr>}
          {rows.map(r => (
            <tr key={r.id}>
              <td className="px-3 py-2 mono text-primary font-medium">{r.whtCertificateNumber}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.customer}</td>
              <td className="px-3 py-2 mono">{fmtDate(r.date)}</td>
              <td className="px-3 py-2 mono text-muted-foreground">{r.invoiceNo}</td>
              <td className="px-3 py-2 mono text-right font-semibold">{formatNGN(r.whtAmount)}</td>
              <td className="px-3 py-2"><Tag tone="success">Available</Tag></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────── Helpers ─────────
function SearchBar({ value, onChange, placeholder }:
  { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-10 rounded-lg border border-border bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
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
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-1 rounded border border-border bg-card disabled:opacity-50 hover:bg-secondary">Prev</button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="px-3 py-1 rounded border border-border bg-card disabled:opacity-50 hover:bg-secondary">Next</button>
      </div>
    </div>
  );
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

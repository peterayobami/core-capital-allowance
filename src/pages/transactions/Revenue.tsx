import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { formatNGN, formatDate } from "@/lib/utils/format";
import { TxnKpi, TxnToolbar, TxnPageHeader, YesNoBadge, CategoryChip } from "@/components/transactions/TxnPrimitives";
import { RevenueFormPanel } from "@/components/transactions/RevenueFormPanel";
import { Coins, Percent, FileText, Calendar } from "lucide-react";

export default function RevenuePage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const pageSize = 10;
  const all = transactionsRepository.listRevenues();

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return all.filter(r =>
      r.description.toLowerCase().includes(s) ||
      r.invoiceNo.toLowerCase().includes(s) ||
      r.customer.toLowerCase().includes(s),
    );
  }, [all, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalRev = all.reduce((s, r) => s + r.sales, 0);
  const outputVat = Math.round(all.filter(r => r.vat).reduce((s, r) => s + r.sales * 0.075, 0));
  const whtCredits = Math.round(all.reduce((s, r) => s + r.sales * 0.05, 0) * 0.6);
  const mtd = all.filter(r => r.date.startsWith("2026-04")).reduce((s, r) => s + r.sales, 0);

  return (
    <AppShell title="Revenue">
      <div className="px-7 py-6">
        <TxnPageHeader title="Revenue" subtitle="Manage sales invoices and recognised revenue." />

        <div className="grid gap-4 mb-5 grid-cols-2 xl:grid-cols-4">
          <TxnKpi label="Total Revenue" icon={Coins} value={formatNGN(totalRev)} sublabel={`${all.length} invoices`} />
          <TxnKpi label="Output VAT" icon={Percent} value={formatNGN(outputVat)} sublabel="Payable to FIRS" tone="success" />
          <TxnKpi label="WHT Credits" icon={FileText} value={formatNGN(whtCredits)} sublabel="Withheld by customers" tone="warning" />
          <TxnKpi label="Month to Date" icon={Calendar} value={formatNGN(mtd)} sublabel="Current month" />
        </div>

        <TxnToolbar placeholder="Search by description or invoice..." value={q} onChange={(v) => { setQ(v); setPage(1); }} ctaLabel="New Revenue" onCta={() => setPanelOpen(true)} />

        <div className="cl-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th><Th>Invoice #</Th><Th>Description</Th><Th>Customer</Th>
                  <Th>Category</Th><Th right>Sales</Th><Th>VAT</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-secondary/40">
                    <td className="px-4 py-3 mono whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 mono text-muted-foreground whitespace-nowrap">{r.invoiceNo}</td>
                    <td className="px-4 py-3">{r.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.customer}</td>
                    <td className="px-4 py-3"><CategoryChip label={r.category} /></td>
                    <td className="px-4 py-3 mono text-right whitespace-nowrap">{formatNGN(r.sales, { decimals: 2 })}</td>
                    <td className="px-4 py-3"><YesNoBadge value={r.vat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} unit="revenues" />
        </div>
      </div>
      <RevenueFormPanel open={panelOpen} onClose={() => setPanelOpen(false)} onSaved={() => { }} />
    </AppShell>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Pager({ page, totalPages, setPage, total, unit }: any) {
  return (
    <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
      <div>{total} total {unit}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary disabled:opacity-40">‹</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary disabled:opacity-40">›</button>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { formatNGN, formatDate } from "@/lib/utils/format";
import { TxnKpi, TxnToolbar, TxnPageHeader, YesNoBadge } from "@/components/transactions/TxnPrimitives";
import { PurchaseFormPanel } from "@/components/transactions/PurchaseFormPanel";
import { Coins, Percent, FileText, Calendar } from "lucide-react";

export default function PurchasesPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const pageSize = 10;
  const all = transactionsRepository.listPurchases();

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return all.filter(p =>
      p.description.toLowerCase().includes(s) ||
      p.invoiceNo.toLowerCase().includes(s) ||
      p.vendor.toLowerCase().includes(s),
    );
  }, [all, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalValue = all.reduce((s, p) => s + p.cost, 0);
  const vatRecoverable = Math.round(all.filter(p => p.vat).reduce((s, p) => s + p.cost * 0.075, 0));
  const whtWithheld = Math.round(all.reduce((s, p) => s + p.cost * (p.whtPct ?? 0) / 100, 0));
  const mtd = all.filter(p => p.date.startsWith("2026-04")).reduce((s, p) => s + p.cost, 0);

  return (
    <AppShell title="Purchases">
      <div className="px-7 py-6">
        <TxnPageHeader title="Purchases" subtitle="Capture and reconcile all purchase invoices." />

        <div className="grid gap-4 mb-5 grid-cols-2 xl:grid-cols-4">
          <TxnKpi label="Total Purchase Value" icon={Coins} value={formatNGN(totalValue)} sublabel={`${all.length} invoices`} />
          <TxnKpi label="VAT Recoverable" icon={Percent} value={formatNGN(vatRecoverable)} sublabel="Input VAT" tone="success" />
          <TxnKpi label="WHT Withheld" icon={FileText} value={formatNGN(whtWithheld)} sublabel="Remittable to FIRS" tone="warning" />
          <TxnKpi label="Month to Date" icon={Calendar} value={formatNGN(mtd)} sublabel="Current month" />
        </div>

        <TxnToolbar placeholder="Search by description or invoice..." value={q} onChange={(v) => { setQ(v); setPage(1); }} ctaLabel="New Purchase" onCta={() => setPanelOpen(true)} />

        <div className="cl-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th><Th>Invoice #</Th><Th>Description</Th><Th>Vendor</Th>
                  <Th right>Cost</Th><Th>VAT</Th><Th>WHT</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(p => (
                  <tr key={p.id} className="border-b border-border/60 hover:bg-secondary/40">
                    <td className="px-4 py-3 mono whitespace-nowrap">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 mono text-muted-foreground whitespace-nowrap">{p.invoiceNo}</td>
                    <td className="px-4 py-3">{p.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.vendor}</td>
                    <td className="px-4 py-3 mono text-right whitespace-nowrap">{formatNGN(p.cost, { decimals: 2 })}</td>
                    <td className="px-4 py-3"><YesNoBadge value={p.vat} /></td>
                    <td className="px-4 py-3">
                      {p.whtPct ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/15 text-warning">{p.whtPct}%</span>
                      ) : <YesNoBadge value={false} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} unit="purchases" />
        </div>
      </div>
      <PurchaseFormPanel open={panelOpen} onClose={() => setPanelOpen(false)} onSaved={() => { }} />
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

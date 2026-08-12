import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { formatNGN, formatDate } from "@/lib/utils/format";
import { TxnKpi, TxnToolbar, TxnPageHeader, YesNoBadge, CategoryChip } from "@/components/transactions/TxnPrimitives";
import { ExpenseFormPanel } from "@/components/transactions/ExpenseFormPanel";
import { Coins, ShieldCheck, ShieldX, Calendar } from "lucide-react";

export default function ExpensesPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const pageSize = 10;
  const all = transactionsRepository.listExpenses();

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return all.filter(e =>
      e.description.toLowerCase().includes(s) ||
      e.invoiceNo.toLowerCase().includes(s) ||
      e.supplier.toLowerCase().includes(s),
    );
  }, [all, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const total = all.reduce((s, e) => s + e.cost, 0);
  const deductible = all.filter(e => e.deductible).reduce((s, e) => s + e.cost, 0);
  const nonDed = total - deductible;
  const mtd = all.filter(e => e.date.startsWith("2026-04")).reduce((s, e) => s + e.cost, 0);

  return (
    <AppShell title="Expenses">
      <div className="px-7 py-6">
        <TxnPageHeader title="Expenses" subtitle="Track operating expenses with deductibility flags." />

        <div className="grid gap-4 mb-5 grid-cols-2 xl:grid-cols-4">
          <TxnKpi label="Total Expenses" icon={Coins} value={formatNGN(total)} sublabel={`${all.length} entries`} tone="warning" />
          <TxnKpi label="Tax-Deductible" icon={ShieldCheck} value={formatNGN(deductible)} sublabel="Allowable for CIT" tone="success" />
          <TxnKpi label="Non-Deductible" icon={ShieldX} value={formatNGN(nonDed)} sublabel="Add-back items" tone="danger" />
          <TxnKpi label="Month to Date" icon={Calendar} value={formatNGN(mtd)} sublabel="Current month" />
        </div>

        <TxnToolbar placeholder="Search by description or invoice..." value={q} onChange={(v) => { setQ(v); setPage(1); }} ctaLabel="New Expense" onCta={() => setPanelOpen(true)} />

        <div className="cl-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th><Th>Invoice #</Th><Th>Description</Th><Th>Supplier</Th>
                  <Th>Category</Th><Th right>Cost</Th><Th>Deductible</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(e => (
                  <tr key={e.id} className="border-b border-border/60 hover:bg-secondary/40">
                    <td className="px-4 py-3 mono whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 mono text-muted-foreground whitespace-nowrap">{e.invoiceNo}</td>
                    <td className="px-4 py-3">{e.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.supplier}</td>
                    <td className="px-4 py-3"><CategoryChip label={e.category} /></td>
                    <td className="px-4 py-3 mono text-right whitespace-nowrap">{formatNGN(e.cost, { decimals: 2 })}</td>
                    <td className="px-4 py-3"><YesNoBadge value={e.deductible} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} unit="expenses" />
        </div>
      </div>
      <ExpenseFormPanel open={panelOpen} onClose={() => setPanelOpen(false)} onSaved={() => { }} />
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

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { formatNGN, formatDate } from "@/lib/utils/format";
import { TxnKpi, TxnToolbar, TxnPageHeader, CategoryChip } from "@/components/transactions/TxnPrimitives";
import { AssetFormPanel } from "@/components/transactions/AssetFormPanel";
import { Boxes, Coins, Calendar, Layers, Sparkles } from "lucide-react";

export default function AssetsPage() {
  const [q, setQ] = useState("");
  const all = transactionsRepository.listAssets();
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return all.filter(a =>
      a.description.toLowerCase().includes(s) ||
      a.classification.toLowerCase().includes(s),
    );
  }, [all, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalCost = all.reduce((s, a) => s + a.cost, 0);
  const ytd = all.filter(a => a.dateCreated.startsWith("2026")).reduce((s, a) => s + a.cost, 0);
  const classifications = new Set(all.map(a => a.classification)).size;
  const mostRecent = [...all].sort((a, b) => b.dateCreated.localeCompare(a.dateCreated))[0];

  return (
    <AppShell title="Assets">
      <div className="px-7 py-6">
        <TxnPageHeader title="Assets" subtitle="Track and manage all company assets." />

        <div className="grid gap-4 mb-5 grid-cols-2 xl:grid-cols-4">
          <TxnKpi label="Total Asset Cost" icon={Coins} value={formatNGN(totalCost)} sublabel={`${all.length} records`} />
          <TxnKpi label="Acquired YTD" icon={Calendar} value={formatNGN(ytd)} sublabel="Since Jan 1" tone="success" />
          <TxnKpi label="Classifications In Use" icon={Layers} value={classifications.toString()} sublabel="Categories" />
          <TxnKpi label="Most Recent" icon={Sparkles} value={mostRecent ? formatDate(mostRecent.dateCreated) : "—"} sublabel={mostRecent?.description} tone="warning" />
        </div>

        <TxnToolbar placeholder="Search assets..." value={q} onChange={(v) => { setQ(v); setPage(1); }} ctaLabel="New Asset" onCta={() => setPanelOpen(true)} />

        <div className="cl-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date Created</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date Purchased</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Classification</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id} className="border-b border-border/60 hover:bg-secondary/40">
                    <td className="px-4 py-3 mono text-foreground/90 whitespace-nowrap">{formatDate(a.dateCreated)}</td>
                    <td className="px-4 py-3">{a.description}</td>
                    <td className="px-4 py-3 mono text-right whitespace-nowrap">{formatNGN(a.cost, { decimals: 2 })}</td>
                    <td className="px-4 py-3 mono text-foreground/90 whitespace-nowrap">{formatDate(a.datePurchased)}</td>
                    <td className="px-4 py-3"><CategoryChip label={a.classification} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{a.remarks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} unit="assets" />
        </div>
      </div>
      <AssetFormPanel open={panelOpen} onClose={() => setPanelOpen(false)} onSaved={() => { }} />
    </AppShell>
  );
}

function Pager({ page, totalPages, setPage, total, unit }: {
  page: number; totalPages: number; setPage: (n: number) => void; total: number; unit: string;
}) {
  return (
    <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
      <div>{total} total {unit}</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary disabled:opacity-40"
        >‹</button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary disabled:opacity-40"
        >›</button>
      </div>
    </div>
  );
}

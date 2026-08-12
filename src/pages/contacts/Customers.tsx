import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactsLayout } from "@/components/contacts/ContactsLayout";
import { SearchInput } from "@/components/shared/SearchInput";
import { LinearProgress } from "@/components/shared/Shimmer";
import { CustomerCard, CustomerCardShimmer } from "@/components/contacts/CustomerCard";
import { CustomerPanel } from "@/components/contacts/CustomerPanel";
import { useCustomers } from "@/hooks/contacts/use-customers";

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const { data, isLoading, isFetching } = useCustomers();

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(c =>
      c.fullName.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.type.toLowerCase().includes(s),
    );
  }, [data, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <ContactsLayout title="Customers">
      <div className="pt-2 pb-4 sticky top-14 z-10 bg-background">
        <div className="flex items-center gap-3">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search customers" className="w-[320px] max-w-full" />
          <div className="ml-auto">
            <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary-deep">
              <Plus className="h-4 w-4 mr-1.5" /> New Customer
            </Button>
          </div>
        </div>
        <LinearProgress active={!isLoading && isFetching} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CustomerCardShimmer key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} hasSearch={!!q} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.map(c => <CustomerCard key={c.id} customer={c} />)}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <span>{filtered.length} customers</span>
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-2">
                Per page:
                <select
                  className="h-8 px-2 rounded-md border border-border bg-card"
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button className="h-7 w-7 rounded-md border border-border disabled:opacity-40" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                <span>Page {page} of {totalPages}</span>
                <button className="h-7 w-7 rounded-md border border-border disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          </div>
        </>
      )}

      <CustomerPanel open={open} onClose={() => setOpen(false)} />
    </ContactsLayout>
  );
}

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative h-24 w-24 rounded-2xl grid place-items-center"
           style={{ background: "rgba(24,79,151,0.10)" }}>
        <Users className="h-10 w-10 text-primary" />
        <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-warning text-white grid place-items-center text-base font-bold">+</span>
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">
        {hasSearch ? "No customers match your search" : "No Customers Yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">
        {hasSearch
          ? "Try a different search term."
          : "You haven't added any customers yet. Once customers are created, they'll appear here for easy management."}
      </p>
      {!hasSearch && (
        <Button onClick={onAdd} className="mt-5 bg-primary text-primary-foreground hover:bg-primary-deep">
          <Plus className="h-4 w-4 mr-1.5" /> Add First Customer
        </Button>
      )}
    </div>
  );
}

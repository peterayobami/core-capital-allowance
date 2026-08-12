import { useMemo, useState } from "react";
import { Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactsLayout } from "@/components/contacts/ContactsLayout";
import { SearchInput } from "@/components/shared/SearchInput";
import { LinearProgress } from "@/components/shared/Shimmer";
import { VendorCard, VendorCardShimmer } from "@/components/contacts/VendorCard";
import { VendorPanel } from "@/components/contacts/VendorPanel";
import { useVendors } from "@/hooks/contacts/use-vendors";

export default function VendorsPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isLoading, isFetching } = useVendors();

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(v =>
      v.companyName.toLowerCase().includes(s) ||
      v.companyEmail.toLowerCase().includes(s) ||
      v.contact?.fullName.toLowerCase().includes(s),
    );
  }, [data, q]);

  return (
    <ContactsLayout title="Vendors">
      <div className="pt-2 pb-4 sticky top-14 z-10 bg-background">
        <div className="flex items-center gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search vendors" className="w-[320px] max-w-full" />
          <div className="ml-auto">
            <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary-deep">
              <Plus className="h-4 w-4 mr-1.5" /> New Vendor
            </Button>
          </div>
        </div>
        <LinearProgress active={!isLoading && isFetching} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <VendorCardShimmer key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} hasSearch={!!q} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(v => <VendorCard key={v.id} vendor={v} />)}
        </div>
      )}

      <VendorPanel open={open} onClose={() => setOpen(false)} />
    </ContactsLayout>
  );
}

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-[88px] w-[88px] rounded-full bg-muted grid place-items-center text-muted-foreground">
        <Store className="h-9 w-9" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {hasSearch ? "No vendors match your search" : "No vendors yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {hasSearch ? "Try a different search term." : "Vendors you add will show up here."}
      </p>
      {!hasSearch && (
        <Button onClick={onAdd} className="mt-5 bg-primary text-primary-foreground hover:bg-primary-deep">
          <Plus className="h-4 w-4 mr-1.5" /> Add First Vendor
        </Button>
      )}
    </div>
  );
}

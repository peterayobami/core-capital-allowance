import { useParams } from "react-router-dom";
import { useState } from "react";
import { Building2, ShoppingCart, Wallet, Receipt, MapPin, Mail, Phone, Search } from "lucide-react";
import { ContactsLayout } from "@/components/contacts/ContactsLayout";
import { KpiCard } from "@/components/shared/KpiCard";
import { ClCard, ClCardHeader } from "@/components/shared/ClCard";
import { Button } from "@/components/ui/button";
import { ColoredAvatar, PrimaryIconBadge } from "@/components/shared/Avatar";
import { useVendor } from "@/hooks/contacts/use-vendors";
import { VendorPanel } from "@/components/contacts/VendorPanel";
import { ShimmerBox } from "@/components/shared/Shimmer";

export default function VendorDetailPage() {
  const { id = "" } = useParams();
  const { data: vendor, isLoading } = useVendor(id);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <ContactsLayout title="Vendor Detail">
      {isLoading ? (
        <DetailShimmer />
      ) : !vendor ? (
        <div className="py-24 text-center text-muted-foreground">Vendor not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 pt-4">
          {/* Left column */}
          <div className="space-y-6 min-w-0">
            <section>
              <h2 className="text-base font-semibold mb-3">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="Total Purchases" accent="primary" value={vendor.totalPurchases ?? "—"} icon={<ShoppingCart className="h-4 w-4" />} />
                <KpiCard label="Total Amount" accent="success" value={vendor.totalAmount ? `₦${vendor.totalAmount.toLocaleString()}` : "₦0"} icon={<Wallet className="h-4 w-4" />} />
                <KpiCard label="Outstanding" accent="warning" value={vendor.outstanding ? `₦${vendor.outstanding.toLocaleString()}` : "₦0"} icon={<Receipt className="h-4 w-4" />} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 sticky top-14 bg-background py-2 z-[1]">
                <h2 className="text-base font-semibold">Purchases</h2>
                <div className="relative w-[260px] max-w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="Search"
                    className="w-full h-9 pl-9 pr-3 rounded-md bg-input border border-transparent text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="cl-card flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted grid place-items-center text-muted-foreground">
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <div className="mt-3 font-semibold text-foreground">No purchases yet</div>
                <div className="text-xs text-muted-foreground mt-1">Purchase orders raised for this vendor will appear here.</div>
              </div>
            </section>
          </div>

          {/* Right side panel */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <ClCard>
              <ClCardHeader>Merchant</ClCardHeader>
              <div className="flex items-start gap-3">
                <PrimaryIconBadge size={44}>
                  <Building2 className="h-5 w-5" />
                </PrimaryIconBadge>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{vendor.companyName}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <Row icon={<MapPin className="h-3.5 w-3.5" />}>{vendor.address}</Row>
                <Row icon={<Mail className="h-3.5 w-3.5" />} primary>{vendor.companyEmail}</Row>
                <Row icon={<Phone className="h-3.5 w-3.5" />} primary>{vendor.companyPhone}</Row>
              </div>
            </ClCard>

            {vendor.contact && (
              <ClCard>
                <ClCardHeader>Contact Person</ClCardHeader>
                <div className="flex items-start gap-3">
                  <ColoredAvatar name={vendor.contact.fullName} size={44} />
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{vendor.contact.fullName}</div>
                    <div className="text-xs text-muted-foreground">{vendor.contact.role}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  {vendor.contact.email && <Row icon={<Mail className="h-3.5 w-3.5" />} primary>{vendor.contact.email}</Row>}
                  {vendor.contact.phone && <Row icon={<Phone className="h-3.5 w-3.5" />} primary>{vendor.contact.phone}</Row>}
                </div>
              </ClCard>
            )}

            <ClCard>
              <ClCardHeader>Quick Actions</ClCardHeader>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-deep">New Purchase</Button>
              <Button variant="outline" className="w-full mt-2" onClick={() => setEditOpen(true)}>Edit Vendor</Button>
            </ClCard>
          </div>
        </div>
      )}

      <VendorPanel open={editOpen} onClose={() => setEditOpen(false)} vendor={vendor ?? undefined} />
    </ContactsLayout>
  );
}

function Row({ icon, children, primary }: { icon: React.ReactNode; children: React.ReactNode; primary?: boolean }) {
  return (
    <div className={`flex items-start gap-2 ${primary ? "text-primary" : "text-muted-foreground"}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="break-words">{children}</span>
    </div>
  );
}

function DetailShimmer() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 pt-4">
      <div className="space-y-6">
        <ShimmerBox width={80} height={20} />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <ShimmerBox key={i} height={92} />)}
        </div>
        <ShimmerBox height={40} />
        {Array.from({ length: 5 }).map((_, i) => <ShimmerBox key={i} height={48} />)}
      </div>
      <div className="space-y-3">
        <ShimmerBox height={120} />
        <ShimmerBox height={130} />
        <ShimmerBox height={96} />
      </div>
    </div>
  );
}

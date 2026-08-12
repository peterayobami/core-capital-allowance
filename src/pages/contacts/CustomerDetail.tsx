import { useParams } from "react-router-dom";
import { useState } from "react";
import { Building2, Receipt, Wallet, Percent, Mail, Phone, MapPin, Search } from "lucide-react";
import { ContactsLayout } from "@/components/contacts/ContactsLayout";
import { KpiCard } from "@/components/shared/KpiCard";
import { ClCard, ClCardHeader } from "@/components/shared/ClCard";
import { Button } from "@/components/ui/button";
import { ColoredAvatar, PrimaryIconBadge } from "@/components/shared/Avatar";
import { useCustomer } from "@/hooks/contacts/use-customers";
import { CustomerPanel } from "@/components/contacts/CustomerPanel";
import { ShimmerBox } from "@/components/shared/Shimmer";

export default function CustomerDetailPage() {
  const { id = "" } = useParams();
  const { data: customer, isLoading } = useCustomer(id);
  const [editOpen, setEditOpen] = useState(false);
  const isOrg = customer && customer.type !== "Individual";

  return (
    <ContactsLayout title="Customer Detail">
      {isLoading ? (
        <ShimmerBox height={400} />
      ) : !customer ? (
        <div className="py-24 text-center text-muted-foreground">Customer not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 pt-4">
          <div className="space-y-6 min-w-0">
            <section>
              <h2 className="text-base font-semibold mb-3">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="Total Invoices" accent="primary" value={customer.totalInvoices ?? 0} icon={<Receipt className="h-4 w-4" />} />
                <KpiCard label="Total Revenue" accent="success" value={customer.totalRevenue ? `₦${customer.totalRevenue.toLocaleString()}` : "₦0"} icon={<Wallet className="h-4 w-4" />} />
                <KpiCard label="Total VAT" accent="warning" value={customer.totalVat ? `₦${customer.totalVat.toLocaleString()}` : "₦0"} icon={<Percent className="h-4 w-4" />} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 sticky top-14 bg-background py-2 z-[1]">
                <h2 className="text-base font-semibold">Transactions</h2>
                <div className="relative w-[260px] max-w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input placeholder="Search" className="w-full h-9 pl-9 pr-3 rounded-md bg-input border border-transparent text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="cl-card flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted grid place-items-center text-muted-foreground">
                  <Receipt className="h-7 w-7" />
                </div>
                <div className="mt-3 font-semibold text-foreground">No transactions yet</div>
                <div className="text-xs text-muted-foreground mt-1">Invoices raised for this customer will appear here.</div>
              </div>
            </section>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <ClCard>
              <ClCardHeader>Customer</ClCardHeader>
              <div className="flex items-start gap-3">
                {isOrg ? (
                  <PrimaryIconBadge size={44}><Building2 className="h-5 w-5" /></PrimaryIconBadge>
                ) : (
                  <ColoredAvatar name={customer.fullName} size={44} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="font-semibold text-foreground flex-1">{customer.fullName}</div>
                    <span className="cl-tag">{customer.type}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{customer.type}</div>
                </div>
              </div>
              {customer.address && (
                <div className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="break-words">{customer.address}</span>
                </div>
              )}
            </ClCard>

            <ClCard>
              <ClCardHeader>Contact</ClCardHeader>
              <div className="space-y-1.5 text-xs text-primary">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span>{customer.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{customer.phone}</span></div>
              </div>
            </ClCard>

            <ClCard>
              <ClCardHeader>Quick Actions</ClCardHeader>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-deep">New Invoice</Button>
              <Button variant="outline" className="w-full mt-2" onClick={() => setEditOpen(true)}>Edit Customer</Button>
            </ClCard>
          </div>
        </div>
      )}

      <CustomerPanel open={editOpen} onClose={() => setEditOpen(false)} customer={customer ?? undefined} />
    </ContactsLayout>
  );
}

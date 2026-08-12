import { Building2, Mail, Phone, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ColoredAvatar, PrimaryIconBadge } from "@/components/shared/Avatar";
import type { Customer, CustomerType } from "@/lib/models/customer";

const isOrg = (t: CustomerType) => t !== "Individual";

export function CustomerCard({ customer }: { customer: Customer }) {
  const org = isOrg(customer.type);
  return (
    <div className="cl-card p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        {org ? (
          <PrimaryIconBadge size={44}>
            <Building2 className="h-5 w-5" />
          </PrimaryIconBadge>
        ) : (
          <ColoredAvatar name={customer.fullName} size={44} />
        )}
        <span className="cl-tag">{customer.type}</span>
      </div>
      <div className="mt-3">
        <div className="font-semibold text-foreground truncate">{customer.fullName}</div>
        <div className="text-xs text-muted-foreground truncate">{customer.email}</div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{customer.email}</span></div>
        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{customer.phone}</span></div>
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <Link to={`/contacts/customers/${customer.id}`}>
          <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function CustomerCardShimmer() {
  return (
    <div className="cl-card p-4">
      <div className="flex justify-between">
        <div className="shimmer-box h-11 w-11 rounded-full" />
        <div className="shimmer-box h-5 w-20 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="shimmer-box h-4 w-32" />
        <div className="shimmer-box h-3 w-40" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="shimmer-box h-3 w-44" />
        <div className="shimmer-box h-3 w-28" />
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <div className="shimmer-box h-9 w-full" />
      </div>
    </div>
  );
}

import { Building2, ChevronRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import type { Customer, CustomerType } from "@/lib/models/customer";

const isOrg = (t: CustomerType) => t !== "Individual";

export function CustomerCard({ customer }: { customer: Customer }) {
  const org = isOrg(customer.type);
  return (
    <div className="cl-card p-6 rounded-2xl flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="h-12 w-12 rounded-full bg-muted grid place-items-center text-muted-foreground">
          {org ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
          {customer.type}
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground truncate">{customer.fullName}</h3>
        <div className="mt-4 space-y-1.5">
          <p className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="truncate">{customer.email}</span>
          </p>
          <p className="text-sm text-muted-foreground font-mono truncate">{customer.phone}</p>
        </div>
      </div>

      <div className="mt-auto">
        <Link
          to={`/contacts/customers/${customer.id}`}
          className="group w-full py-3 px-4 bg-primary hover:bg-primary-deep text-primary-foreground text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          View Details
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

export function CustomerCardShimmer() {
  return (
    <div className="cl-card p-6 rounded-2xl">
      <div className="flex justify-between">
        <div className="shimmer-box h-12 w-12 rounded-full" />
        <div className="shimmer-box h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 space-y-3">
        <div className="shimmer-box h-5 w-40" />
        <div className="shimmer-box h-3 w-44" />
        <div className="shimmer-box h-3 w-32" />
      </div>
      <div className="mt-6">
        <div className="shimmer-box h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

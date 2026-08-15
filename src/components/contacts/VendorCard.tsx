import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import type { Vendor } from "@/lib/models/vendor";
import { initials } from "@/lib/utils/avatar";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      to={`/contacts/vendors/${vendor.id}`}
      className="cl-card group block p-6 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-14 w-14 shrink-0 rounded-xl grid place-items-center text-xl font-bold bg-primary/10 text-primary border border-primary/20">
            {initials(vendor.companyName)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground leading-tight truncate">
              {vendor.companyName}
            </h3>
            <p className="text-sm text-muted-foreground">Vendor</p>
          </div>
        </div>
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_hsl(var(--success)/0.6)]" />
      </div>

      <div className="space-y-4">
        {vendor.contact && (
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Primary Contact
            </span>
            <p className="text-foreground font-medium truncate">{vendor.contact.fullName}</p>
            <p className="text-xs text-primary font-semibold truncate">{vendor.contact.role}</p>
          </div>
        )}

        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="text-sm truncate">{vendor.contact?.email ?? vendor.companyEmail}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="text-sm font-mono truncate">
              {vendor.contact?.phone ?? vendor.companyPhone}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function VendorCardShimmer() {
  return (
    <div className="cl-card p-6 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="shimmer-box h-14 w-14 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="shimmer-box h-4 w-40" />
          <div className="shimmer-box h-3 w-20" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="shimmer-box h-3 w-24" />
        <div className="shimmer-box h-4 w-32" />
        <div className="shimmer-box h-3 w-28" />
      </div>
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <div className="shimmer-box h-3 w-44" />
        <div className="shimmer-box h-3 w-36" />
      </div>
    </div>
  );
}

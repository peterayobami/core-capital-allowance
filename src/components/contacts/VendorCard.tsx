import { Building2, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { ColoredAvatar, PrimaryIconBadge } from "@/components/shared/Avatar";
import type { Vendor } from "@/lib/models/vendor";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      to={`/contacts/vendors/${vendor.id}`}
      className="cl-card block p-0 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <PrimaryIconBadge size={36}>
          <Building2 className="h-4 w-4" />
        </PrimaryIconBadge>
        <div className="font-semibold text-foreground truncate text-[15px]">
          {vendor.companyName}
        </div>
      </div>
      {vendor.contact && (
        <div className="flex gap-3 p-4">
          <ColoredAvatar name={vendor.contact.fullName} size={40} />
          <div className="min-w-0 space-y-0.5">
            <div className="font-semibold text-foreground text-sm truncate">{vendor.contact.fullName}</div>
            <div className="text-xs text-muted-foreground truncate">{vendor.contact.role}</div>
            {vendor.contact.email && (
              <div className="flex items-center gap-1.5 text-xs text-primary mt-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{vendor.contact.email}</span>
              </div>
            )}
            {vendor.contact.phone && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{vendor.contact.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}

export function VendorCardShimmer() {
  return (
    <div className="cl-card p-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="shimmer-box h-9 w-9" />
        <div className="shimmer-box h-4 w-40" />
      </div>
      <div className="flex gap-3 p-4">
        <div className="shimmer-box h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="shimmer-box h-3 w-32" />
          <div className="shimmer-box h-3 w-24" />
          <div className="shimmer-box h-3 w-40" />
          <div className="shimmer-box h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

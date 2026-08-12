import { Mail, Phone, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ColoredAvatar } from "@/components/shared/Avatar";
import { fullName, type HrEmployee } from "@/lib/models/employee";

export function EmployeeCard({ employee }: { employee: HrEmployee }) {
  const name = fullName(employee);
  return (
    <div className="cl-card overflow-hidden flex flex-col">
      <div className="relative h-16 bg-primary">
        <div className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2">
          <ColoredAvatar name={name} size={72} ringWhite />
        </div>
      </div>
      <div className="pt-12 px-4 pb-4 flex-1 flex flex-col">
        <div className="text-center">
          <div className="font-semibold text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{employee.department}</div>
        </div>
        <div className="mt-4 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-primary">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{employee.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{employee.id}</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <Link to={`/contacts/employees/${employee.id}`}>
            <Button variant="outline" className="w-full bg-input text-muted-foreground border-border-strong hover:bg-muted">
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function EmployeeCardShimmer() {
  return (
    <div className="cl-card overflow-hidden">
      <div className="shimmer-box h-16 rounded-none" />
      <div className="px-4 pb-4 pt-10 space-y-2">
        <div className="shimmer-box h-4 w-32 mx-auto" />
        <div className="shimmer-box h-3 w-20 mx-auto" />
        <div className="shimmer-box h-3 w-40 mt-3" />
        <div className="shimmer-box h-3 w-32" />
        <div className="shimmer-box h-3 w-24" />
        <div className="shimmer-box h-9 w-full mt-3" />
      </div>
    </div>
  );
}

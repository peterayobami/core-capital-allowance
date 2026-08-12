import { User, Building2, HeartHandshake, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerType } from "@/lib/models/customer";

const TYPES: { value: CustomerType; label: string; icon: React.ComponentType<any> }[] = [
  { value: "Individual",   label: "Individual",   icon: User },
  { value: "Organization", label: "Organization", icon: Building2 },
  { value: "Non-Profit",   label: "Non-Profit",   icon: HeartHandshake },
  { value: "Government",   label: "Government",   icon: Landmark },
];

interface Props {
  value?: CustomerType;
  onChange: (v: CustomerType) => void;
  error?: string;
}

export function CustomerTypeChips({ value, onChange, error }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        Customer Type<span className="text-danger ml-0.5">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map(({ value: v, label, icon: Icon }) => {
          const selected = v === value;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "flex items-center gap-2 h-11 px-3 rounded-md text-sm transition-all duration-200 border",
                selected
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border-strong text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

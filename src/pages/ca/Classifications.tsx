import { CALayout } from "@/components/ca/CALayout";
import { CLASSIFICATIONS } from "@/lib/mock-data/ca";
import { Info, Building2, Sofa, Cog, Wheat, Mountain, Car, Bus, FlaskConical, Printer, Monitor, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ICONS: Record<number, any> = {
  1: Building2, 2: Sofa, 3: Cog, 4: Wheat, 5: Mountain,
  6: Car, 7: Bus, 8: FlaskConical, 9: Printer, 10: Monitor, 11: Radio,
};

export default function ClassificationsPage() {
  return (
    <CALayout breadcrumbs={["Assets", "Asset Classifications"]}>
      <TooltipProvider delayDuration={150}>
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Asset Classifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reference of all 11 classifications and their statutory annual allowance rates.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent-soft px-4 py-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-[13px] text-foreground/80">
            Capital allowance rates are governed by the <strong>Nigeria Tax Act 2025</strong> (effective 1 Jan 2026).
            Initial Allowance has been abolished for all asset classes. Only straight-line Annual Allowance applies.
            Classification rates are system-managed and cannot be edited.
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CLASSIFICATIONS.map((c) => {
            const Icon = ICONS[c.id];
            const zero = c.aaRate === 0;
            const card = (
              <div
                key={c.id}
                className={cn(
                  "data-card p-5 flex flex-col gap-3 transition-all hover:shadow-elev",
                  zero && "border-warning/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg grid place-items-center",
                    zero ? "bg-warning-soft text-warning" : "bg-accent-soft text-accent",
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-sm font-bold tabular-nums",
                    zero ? "bg-secondary text-muted-foreground" : "bg-accent text-accent-foreground",
                  )}>
                    {c.aaRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-snug">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.description}</p>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                  <span className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    c.usefulLife ? "border-border bg-secondary text-foreground/80" : "border-border bg-secondary/60 text-muted-foreground",
                  )}>
                    {c.usefulLife ? `${c.usefulLife} years` : "N/A"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Depreciation <span className="font-mono">{c.depreciationRate.toFixed(1)}%</span>
                  </span>
                </div>
              </div>
            );
            return zero ? (
              <Tooltip key={c.id}>
                <TooltipTrigger asChild><div>{card}</div></TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  No annual allowance under NTA 2025. Previously eligible for Initial Allowance, which was abolished effective 1 Jan 2026.
                </TooltipContent>
              </Tooltip>
            ) : card;
          })}
        </div>
      </TooltipProvider>
    </CALayout>
  );
}

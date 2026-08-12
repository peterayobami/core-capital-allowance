import { ChevronDown, Search, Bell, HelpCircle, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import { YEARS, CURRENT_FY } from "@/lib/mock-data/ca";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function statusBadge(status: string, isCurrent: boolean) {
  if (isCurrent) return <span className="text-[10px] text-accent font-medium">(Current)</span>;
  if (status === "locked") return <span className="text-[10px] text-success font-medium">(Locked)</span>;
  if (status === "computed") return <span className="text-[10px] text-warning font-medium">(Pending Lock)</span>;
  return <span className="text-[10px] text-muted-foreground">(Not Computed)</span>;
}

export function TopBar({ title, breadcrumbs }: { title?: string; breadcrumbs?: string[] }) {
  const { fiscalYear, setFiscalYear } = useFiscalYearStore();
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-full items-center gap-4 px-6">
        {/* Breadcrumb / title */}
        <div className="flex items-center gap-2 min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className={cn(i === breadcrumbs.length - 1 && "text-foreground font-medium")}>{b}</span>
                  {i < breadcrumbs.length - 1 && <span className="text-border-strong">/</span>}
                </span>
              ))}
            </nav>
          ) : (
            <h1 className="text-sm font-semibold">{title}</h1>
          )}
        </div>

        {/* Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search transactions, assets, schedules…"
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-1.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Tenant */}
          <div className="hidden xl:flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
            <div className="h-6 w-6 rounded bg-primary/90 text-primary-foreground grid place-items-center text-[11px] font-semibold">AC</div>
            <div className="leading-tight">
              <div className="text-xs font-medium">Acme Industries Ltd</div>
              <div className="text-[10px] text-muted-foreground">Tenant ID: ACM-2025</div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* FY selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-mono">
                FY {fiscalYear}
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Select Fiscal Year</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[...YEARS].reverse().map((y) => (
                <DropdownMenuItem
                  key={y.fiscalYear}
                  onClick={() => setFiscalYear(y.fiscalYear)}
                  className={cn("flex items-center justify-between", y.fiscalYear === fiscalYear && "bg-accent-soft")}
                >
                  <span className="font-mono">FY {y.fiscalYear}</span>
                  {statusBadge(y.status, y.fiscalYear === CURRENT_FY)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button className="relative h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
            OA
          </div>
        </div>
      </div>
    </header>
  );
}

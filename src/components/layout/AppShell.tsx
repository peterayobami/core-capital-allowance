import { ReactNode } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutGrid, Building2, UserCircle2, Users,
  Boxes, ShoppingCart, TrendingUp, Receipt as ReceiptIcon,
  Calculator, Wallet, Percent, FileText, Landmark,
  PieChart, Scale, ArrowDownUp, FileSpreadsheet,
  Network, BookOpen, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, ChevronDown, Bell, HelpCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { useOrgSettings } from "@/stores/org-settings.store";

type NavRow =
  | { kind: "item"; label: string; to: string; icon: any }
  | { kind: "label"; label: string };

const NAV: NavRow[] = [
  { kind: "item", label: "Dashboard", to: "/", icon: LayoutGrid },

  { kind: "label", label: "Contacts" },
  { kind: "item", label: "Vendors",   to: "/contacts/vendors",   icon: Building2 },
  { kind: "item", label: "Customers", to: "/contacts/customers", icon: UserCircle2 },
  { kind: "item", label: "Employees", to: "/contacts/employees", icon: Users },

  { kind: "label", label: "Transactions" },
  { kind: "item", label: "Assets",    to: "/transactions/assets",    icon: Boxes },
  { kind: "item", label: "Purchases", to: "/transactions/purchases", icon: ShoppingCart },
  { kind: "item", label: "Revenue",   to: "/transactions/revenue",   icon: TrendingUp },
  { kind: "item", label: "Expenses",  to: "/transactions/expenses",  icon: ReceiptIcon },

  { kind: "label", label: "Taxation" },
  { kind: "item", label: "Capital Allowance", to: "/taxation/capital-allowance", icon: Calculator },
  { kind: "item", label: "Payroll",           to: "/taxation/paye",              icon: Wallet },
  { kind: "item", label: "VAT Computation",   to: "/taxation/vat",               icon: Percent },
  { kind: "item", label: "WHT",               to: "/taxation/wht",               icon: FileText },
  { kind: "item", label: "Income Taxes",      to: "/taxation/income-taxes",      icon: Landmark },

  { kind: "label", label: "Reports" },
  { kind: "item", label: "Profit and Loss", to: "/reports/profit-and-loss", icon: PieChart },
  { kind: "item", label: "Balance Sheet",   to: "/reports/balance-sheet",   icon: Scale },
  { kind: "item", label: "Cash Flow",       to: "/reports/cash-flow",       icon: ArrowDownUp },
  { kind: "item", label: "Trial Balance",   to: "/reports/trial-balance",   icon: FileSpreadsheet },

  { kind: "label", label: "Books" },
  { kind: "item", label: "Charts of Account", to: "/books/charts-of-accounts", icon: Network },
  { kind: "item", label: "Journals",          to: "/books/journals",           icon: BookOpen },
];

function SidebarItem({ row }: { row: Extract<NavRow, { kind: "item" }> }) {
  const Icon = row.icon;
  return (
    <NavLink
      to={row.to}
      end={row.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
          isActive
            ? "text-primary font-semibold bg-primary/10"
            : "text-[#6A7282] hover:text-primary hover:bg-primary/5",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-[#6A7282]")} />
          <span className="flex-1 truncate">{row.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col bg-card shrink-0 border-r border-border h-screen sticky top-0"
      style={{ width: 250 }}
    >
      {/* Brand header — Core Ledger */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <img src={logo} alt="Core Ledger" className="h-7 w-auto object-contain" />
        <div className="text-[14px] font-semibold text-foreground tracking-tight">
          Core Ledger
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden p-3">
        <div className="space-y-0.5">
          {NAV.map((row, i) => {
            if (row.kind === "label") {
              return (
                <div
                  key={`l-${i}`}
                  className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#999999]"
                >
                  {row.label}
                </div>
              );
            }
            return <SidebarItem key={row.to} row={row} />;
          })}
        </div>
      </nav>

      {/* Sticky Settings — bottom of sidebar */}
      <div className="shrink-0 border-t border-border p-3">
        <SidebarItem row={{ kind: "item", label: "Settings", to: "/settings", icon: SettingsIcon }} />
      </div>
    </aside>
  );
}

function OrgMenu() {
  const company = useOrgSettings(s => s.company);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 h-9 px-2.5 rounded-md hover:bg-secondary transition-colors max-w-[260px]">
        <div className="h-7 w-7 rounded-md bg-primary/10 text-primary grid place-items-center text-[11px] font-semibold shrink-0">
          {company.name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
        </div>
        <div className="leading-tight text-left min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">{company.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">Organisation</div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Organisation Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings/org/company">Company Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings/org/fiscal-years">Fiscal Years</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings/org/opening-balances">Opening Balances</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings/org/tax-config">Tax Configuration</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">All Settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppTopBar({ title }: { title?: string }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 h-14 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="Forward"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <OrgMenu />
      <div className="h-6 w-px bg-border shrink-0" />
      <h1 className="flex-1 text-left text-[15px] font-semibold text-foreground truncate">
        {title ?? "Core Ledger"}
      </h1>
      <div className="flex items-center gap-1 shrink-0">
        <button className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary">
          <Bell className="h-4 w-4" />
        </button>
        <button className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary">
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppTopBar title={title} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2, Calendar, Wallet, Percent, Users2, Plug, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { useOrgSettings } from "@/stores/org-settings.store";

const ORG_NAV = [
  { label: "Company Profile",   to: "/settings/org/company",          icon: Building2 },
  { label: "Fiscal Years",      to: "/settings/org/fiscal-years",     icon: Calendar },
  { label: "Opening Balances",  to: "/settings/org/opening-balances", icon: Wallet },
  { label: "Tax Configuration", to: "/settings/org/tax-config",       icon: Percent },
  { label: "Users & Permissions", to: "/settings/org/users",          icon: Users2 },
  { label: "Integrations",      to: "/settings/org/integrations",     icon: Plug },
];

function OrgSidebar() {
  const company = useOrgSettings(s => s.company);
  return (
    <aside
      className="hidden md:flex flex-col bg-card shrink-0 border-r border-border h-screen sticky top-0"
      style={{ width: 250 }}
    >
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <img src={logo} alt="Core Ledger" className="h-7 w-auto object-contain" />
        <div className="leading-none">
          <div className="text-[12px] font-semibold text-foreground truncate max-w-[140px]">
            {company.name}
          </div>
          <div className="text-[10px] text-muted-foreground">Organisation Settings</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hidden p-3">
        <div className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#999999]">
          Configuration
        </div>
        <div className="space-y-0.5">
          {ORG_NAV.map(row => {
            const Icon = row.icon;
            return (
              <NavLink
                key={row.to}
                to={row.to}
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
          })}
        </div>
      </nav>
    </aside>
  );
}

function OrgTopBar() {
  const navigate = useNavigate();
  return (
    <header
      className="sticky top-0 z-30 h-14 border-b border-border flex items-center px-4 gap-3 shrink-0"
      style={{ background: "hsl(var(--secondary))" }}
    >
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-primary hover:bg-primary/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Core Ledger
      </button>
      <div className="text-[13px] text-muted-foreground flex items-center gap-1.5">
        <span className="text-border-strong">/</span>
        <span className="font-medium text-foreground">Organisation Settings</span>
      </div>
      <div className="ml-auto text-[11px] uppercase tracking-wider font-semibold text-warning">
        Configuration Mode
      </div>
    </header>
  );
}

export function OrgSettingsShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <OrgSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <OrgTopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1200px] w-full mx-auto">
            <div className="mb-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Organisation Settings
              </div>
              <h1 className="text-xl font-semibold mt-1">{title}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

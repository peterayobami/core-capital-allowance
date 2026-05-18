import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Briefcase, Users, UserSquare2,
  Boxes, ShoppingCart, TrendingUp, Receipt,
  Calculator, Wallet, Percent, FileBarChart, Building,
  PieChart, Scale, ArrowDownUp, BookOpenCheck,
  Network, BookText, UserCircle, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const USER_SETTINGS_RETURN_KEY = "user-settings-return";

interface NavItem { label: string; to: string; icon: React.ComponentType<{ size?: string | number; strokeWidth?: string | number; className?: string }> }
interface NavGroup { label?: string; items: NavItem[] }

const groups: NavGroup[] = [
  { items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "CONTACTS", items: [
      { label: "Vendors", to: "/contacts/vendors", icon: Briefcase },
      { label: "Customers", to: "/contacts/customers", icon: Users },
      { label: "Employees", to: "/contacts/employees", icon: UserSquare2 },
    ]
  },
  {
    label: "REPORTS", items: [
      { label: "Profit and Loss", to: "/reports/profit-and-loss", icon: PieChart },
      { label: "Balance Sheet", to: "/reports/balance-sheet", icon: Scale },
      { label: "Cash Flow", to: "/reports/cash-flow", icon: ArrowDownUp },
      { label: "Trial Balance", to: "/reports/trial-balance", icon: BookOpenCheck },
    ]
  },
  {
    label: "BOOKS", items: [
      { label: "Charts of Account", to: "/books/charts-of-accounts", icon: Network },
      { label: "Journals", to: "/books/journals", icon: BookText },
    ]
  },
  {
    label: "TRANSACTIONS", items: [
      { label: "Assets", to: "/transactions/assets", icon: Boxes },
      { label: "Purchases", to: "/transactions/purchases", icon: ShoppingCart },
      { label: "Revenue", to: "/transactions/revenue", icon: TrendingUp },
      { label: "Expenses", to: "/transactions/expenses", icon: Receipt },
    ]
  },
  {
    label: "TAXATION", items: [
      { label: "Capital Allowance", to: "/taxation/capital-allowance", icon: Calculator },
      { label: "PAYE", to: "/taxation/paye", icon: Wallet },
      { label: "VAT Computation", to: "/taxation/vat", icon: Percent },
      { label: "WHT", to: "/taxation/wht", icon: FileBarChart },
      { label: "Company Tax", to: "/taxation/company-tax", icon: Building },
    ]
  },
];

function UserAccountBar() {
  const { data: session } = useSession()
  const displayName = session?.user?.name ?? session?.user?.email ?? 'Account'

  return (
    <div className="shrink-0 border-t border-[var(--cl-border)]/70 px-[13px] py-3">
      <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[var(--cl-text-muted)]">
        <Link
          href="/settings/account/profile"
          onClick={() => sessionStorage.setItem(USER_SETTINGS_RETURN_KEY, window.location.pathname)}
          className="flex items-center gap-3 flex-1 min-w-0 hover:text-[var(--cl-primary)] transition-colors duration-150"
        >
          <UserCircle size={18} strokeWidth={1.8} className="shrink-0" />
          <span className="font-medium truncate">{displayName}</span>
        </Link>
        <button
          onClick={() => {
            // Build the IDS end-session URL with id_token_hint (available
            // client-side via the session) so Duende can identify and destroy
            // the correct SSO session.  signOut() clears the NextAuth cookie
            // and then the redirect callback in [...nextauth].ts lets NextAuth
            // hand the browser off to IDS instead of staying on the app origin.
            const endSession = new URL(
              `${process.env.NEXT_PUBLIC_IDS_URL ?? 'https://localhost:7084'}/connect/endsession`
            )
            if (session?.idToken) endSession.searchParams.set('id_token_hint', session.idToken)
            endSession.searchParams.set('post_logout_redirect_uri', `${window.location.origin}/auth/signin`)
            signOut({ callbackUrl: endSession.toString() })
          }}
          className="shrink-0 h-7 w-7 grid place-items-center rounded-md hover:bg-[rgba(220,38,38,0.08)] hover:text-red-600 transition-colors"
          title="Sign Out"
        >
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}

export function getRouteTitle(pathname: string): string {
  const all = groups.flatMap((g) => g.items);
  const exact = all.find((i) => i.to === pathname);
  if (exact) return exact.label;
  const prefix = all.find((i) => pathname.startsWith(i.to + "/"));
  if (prefix) return prefix.label;
  return "Core Ledger";
}

export function Sidebar() {
  const { pathname } = useRouter();

  return (
    <aside
      className="hidden md:flex flex-col bg-white relative shrink-0 z-30"
      style={{ width: 250, boxShadow: "3px 0 8px rgba(51,51,51,0.059)" }}
    >
      {/* Logo (pinned) */}
      <div className="h-[60px] px-4 flex items-center gap-2 border-b border-[var(--cl-border)]/70 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-[var(--cl-primary)] flex items-center justify-center text-white shrink-0">
          <BookOpenCheck size={20} strokeWidth={2.2} />
        </div>
        <div className="text-[18px] tracking-tight leading-none">
          <span className="font-semibold" style={{ color: "#184F97" }}>Core</span>
          <span className="font-semibold" style={{ color: "#004A7E" }}>Ledger</span>
        </div>
      </div>

      {/* Scrollable menu */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden px-[13px] pt-[13px] pb-[24px]">
        <div className="flex flex-col" style={{ gap: 20 }}>
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.label && (
                <div
                  className="px-2.5 mb-1.5 uppercase text-[11px] font-semibold"
                  style={{ color: "#9D9D9D", letterSpacing: "0.04em" }}
                >
                  {g.label}
                </div>
              )}
              <div className="flex flex-col" style={{ gap: 4 }}>
                {g.items.map((it) => {
                  const active = it.to === "/dashboard"
                    ? pathname === "/dashboard" || pathname === "/"
                    : pathname === it.to || pathname.startsWith(it.to + "/");
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      href={it.to}
                      className={cn(
                        "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
                        active
                          ? "text-[var(--cl-primary)]"
                          : "text-[var(--cl-text-muted)] hover:bg-[rgba(24,79,151,0.06)]"
                      )}
                      style={
                        active
                          ? {
                            backgroundColor: "rgba(24,79,151,0.10)",
                            border: "0.5px solid rgba(24,79,151,0.50)",
                          }
                          : { border: "0.5px solid transparent" }
                      }
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      <span className="font-medium">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <UserAccountBar />
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

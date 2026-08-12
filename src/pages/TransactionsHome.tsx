import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { formatNGN } from "@/lib/utils/format";
import { ArrowRight, Boxes, ShoppingCart, TrendingUp, Receipt } from "lucide-react";

const TILES = [
  { to: "/transactions/assets",    label: "Assets",    icon: Boxes,        tone: "primary" },
  { to: "/transactions/purchases", label: "Purchases", icon: ShoppingCart, tone: "success" },
  { to: "/transactions/revenue",   label: "Revenue",   icon: TrendingUp,   tone: "warning" },
  { to: "/transactions/expenses",  label: "Expenses",  icon: Receipt,      tone: "danger" },
] as const;

const tones: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger:  "bg-danger/12 text-danger",
};

export default function TransactionsHome() {
  const totals = {
    assets:    transactionsRepository.listAssets().reduce((s, x) => s + x.cost, 0),
    purchases: transactionsRepository.listPurchases().reduce((s, x) => s + x.cost, 0),
    revenue:   transactionsRepository.listRevenues().reduce((s, x) => s + x.sales, 0),
    expenses:  transactionsRepository.listExpenses().reduce((s, x) => s + x.cost, 0),
  };
  const counts = {
    assets:    transactionsRepository.listAssets().length,
    purchases: transactionsRepository.listPurchases().length,
    revenue:   transactionsRepository.listRevenues().length,
    expenses:  transactionsRepository.listExpenses().length,
  };
  const valueByKey: Record<string, number> = {
    Assets: totals.assets, Purchases: totals.purchases, Revenue: totals.revenue, Expenses: totals.expenses,
  };
  const countByKey: Record<string, number> = {
    Assets: counts.assets, Purchases: counts.purchases, Revenue: counts.revenue, Expenses: counts.expenses,
  };

  return (
    <AppShell title="Core Ledger">
      <div className="px-7 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-foreground">Welcome to Core Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Quick overview of your transaction modules.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {TILES.map(({ to, label, icon: Icon, tone }) => (
            <Link
              key={to}
              to={to}
              className="group cl-card p-5 border border-border transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4">{label}</p>
              <p className="mono text-xl font-semibold text-foreground mt-1">{formatNGN(valueByKey[label])}</p>
              <p className="text-xs text-muted-foreground mt-1">{countByKey[label]} records</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

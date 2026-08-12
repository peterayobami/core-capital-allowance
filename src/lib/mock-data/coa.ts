// 🔌 BACKEND: This is a default seed Chart of Accounts. Each tenant's COA is
// stored server-side and must be fetched from GET /api/accounts?tenantId=...
// Tenants can add, rename, deactivate accounts; do not treat any code in this
// file as a compile-time invariant.
//
// Multi-tenancy: revenue (4xxx) and expense (6xxx) sub-accounts are
// auto-derived from each tenant's revenue/expense categories at runtime.

import type { ChartOfAccount } from "@/lib/models/ledger";
import { REVENUES, EXPENSES } from "@/lib/mock-data/transactions";

const STATIC_COA: ChartOfAccount[] = [
  // ── Assets ──
  { code: "1000", name: "Assets",                       type: "Asset",      subType: "Header",             normalBalance: "Debit",  isActive: true, description: "Parent header for all asset accounts." },
  { code: "1100", name: "Cash & Bank",                  type: "Asset",      subType: "Current Asset",      normalBalance: "Debit",  parentCode: "1000", isActive: true, description: "Operating cash and bank balances." },
  { code: "1200", name: "Accounts Receivable",          type: "Asset",      subType: "Current Asset",      normalBalance: "Debit",  parentCode: "1000", isActive: true, description: "Amounts owed by customers." },
  { code: "1250", name: "WHT Receivable",               type: "Asset",      subType: "Current Asset",      normalBalance: "Debit",  parentCode: "1000", isActive: true, description: "Withholding tax credits available against CIT." },
  { code: "1260", name: "VAT Recoverable (Input VAT)",  type: "Asset",      subType: "Current Asset",      normalBalance: "Debit",  parentCode: "1000", isActive: true, description: "Input VAT recoverable from FIRS." },
  { code: "1300", name: "Inventory / Stock",            type: "Asset",      subType: "Current Asset",      normalBalance: "Debit",  parentCode: "1000", isActive: true },
  { code: "1400", name: "Prepayments & Other",          type: "Asset",      subType: "Current Asset",      normalBalance: "Debit",  parentCode: "1000", isActive: true },
  { code: "1500", name: "Property, Plant & Equipment",  type: "Asset",      subType: "Non-current Asset",  normalBalance: "Debit",  parentCode: "1000", isActive: true, description: "Fixed assets at cost." },
  { code: "1600", name: "Accumulated Depreciation",     type: "Asset",      subType: "Non-current Asset",  normalBalance: "Credit", parentCode: "1000", isActive: true, description: "Contra-asset: accounting depreciation accumulated." },

  // ── Liabilities ──
  { code: "2000", name: "Liabilities",                  type: "Liability",  subType: "Header",             normalBalance: "Credit", isActive: true },
  { code: "2100", name: "Accounts Payable",             type: "Liability",  subType: "Current Liability",  normalBalance: "Credit", parentCode: "2000", isActive: true },
  { code: "2200", name: "VAT Payable (Output VAT)",     type: "Liability",  subType: "Current Liability",  normalBalance: "Credit", parentCode: "2000", isActive: true },
  { code: "2300", name: "WHT Payable",                  type: "Liability",  subType: "Current Liability",  normalBalance: "Credit", parentCode: "2000", isActive: true },
  { code: "2400", name: "PAYE Payable",                 type: "Liability",  subType: "Current Liability",  normalBalance: "Credit", parentCode: "2000", isActive: true },
  { code: "2500", name: "CIT Payable",                  type: "Liability",  subType: "Current Liability",  normalBalance: "Credit", parentCode: "2000", isActive: true, description: "Company Income Tax owed to FIRS." },

  // ── Equity ──
  { code: "3000", name: "Equity",                       type: "Equity",     subType: "Header",             normalBalance: "Credit", isActive: true },
  { code: "3100", name: "Share Capital",                type: "Equity",     subType: "Equity",             normalBalance: "Credit", parentCode: "3000", isActive: true },
  { code: "3200", name: "Retained Earnings",            type: "Equity",     subType: "Equity",             normalBalance: "Credit", parentCode: "3000", isActive: true },

  // ── Revenue ──
  { code: "4000", name: "Revenue",                      type: "Revenue",    subType: "Header",             normalBalance: "Credit", isActive: true },

  // ── Cost of Sales ──
  { code: "5000", name: "Cost of Sales",                type: "CostOfSales",subType: "Header",             normalBalance: "Debit",  isActive: true },
  { code: "5100", name: "Purchases / COGS",             type: "CostOfSales",subType: "Cost of Sales",      normalBalance: "Debit",  parentCode: "5000", isActive: true },

  // ── Expenses ──
  { code: "6000", name: "Expenses",                     type: "Expense",    subType: "Header",             normalBalance: "Debit",  isActive: true },
  { code: "6800", name: "Depreciation & Amortisation",  type: "Expense",    subType: "Operating Expense",  normalBalance: "Debit",  parentCode: "6000", isActive: true, description: "Accounting depreciation expense — distinct from tax Annual Allowance." },

  // ── Tax expense ──
  { code: "9000", name: "Taxation",                     type: "TaxExpense", subType: "Header",             normalBalance: "Debit",  isActive: true },
  { code: "9100", name: "Company Income Tax",           type: "TaxExpense", subType: "Tax Expense",        normalBalance: "Debit",  parentCode: "9000", isActive: true },
  { code: "9200", name: "Development Levy",             type: "TaxExpense", subType: "Tax Expense",        normalBalance: "Debit",  parentCode: "9000", isActive: true },
];

// ───────────────────────────── Dynamic sub-accounts ──────────────────────────
// 🔌 BACKEND: Revenue 4xxx and Expense 6xxx sub-accounts are created
// automatically when a tenant adds a category. Here we derive them from
// the in-memory transactions seed so the COA stays in sync with mock data.

function uniqueOrdered(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) if (!seen.has(v)) { seen.add(v); out.push(v); }
  return out;
}

const REV_CATEGORIES = uniqueOrdered(REVENUES.map(r => r.category));
const EXP_CATEGORIES = uniqueOrdered(EXPENSES.map(e => e.category)).filter(c => c.toLowerCase() !== "depreciation");

const REVENUE_SUBS: ChartOfAccount[] = REV_CATEGORIES.map((name, i) => ({
  code: `4${(i + 1).toString().padStart(3, "0")}`, // 4100, 4200, ...
  name,
  type: "Revenue",
  subType: "Operating Revenue",
  normalBalance: "Credit",
  parentCode: "4000",
  isActive: true,
  description: `Auto-derived sub-account for revenue category "${name}".`,
}));

const EXPENSE_SUBS: ChartOfAccount[] = EXP_CATEGORIES.map((name, i) => ({
  code: `6${(i + 1).toString().padStart(3, "0")}`, // 6100, 6200, ...
  name,
  type: "Expense",
  subType: "Operating Expense",
  normalBalance: "Debit",
  parentCode: "6000",
  isActive: true,
  description: `Auto-derived sub-account for expense category "${name}".`,
}));

// Final assembled COA, kept in code order for stable display.
export const COA_ACCOUNTS: ChartOfAccount[] = [
  ...STATIC_COA.filter(a => a.code <= "3999"),
  STATIC_COA.find(a => a.code === "4000")!,
  ...REVENUE_SUBS,
  ...STATIC_COA.filter(a => a.code >= "5000" && a.code <= "5999"),
  STATIC_COA.find(a => a.code === "6000")!,
  ...EXPENSE_SUBS,
  STATIC_COA.find(a => a.code === "6800")!,
  ...STATIC_COA.filter(a => a.code >= "9000"),
];

/** Maps a revenue category name to its 4xxx COA account code. */
export const REVENUE_CATEGORY_TO_COA: Record<string, string> = Object.fromEntries(
  REVENUE_SUBS.map(a => [a.name, a.code]),
);

/** Maps an expense category name to its 6xxx COA account code. */
export const EXPENSE_CATEGORY_TO_COA: Record<string, string> = Object.fromEntries(
  EXPENSE_SUBS.map(a => [a.name, a.code]),
);

/** Convenience: find an account by code (or undefined). */
export function findAccount(code: string): ChartOfAccount | undefined {
  return COA_ACCOUNTS.find(a => a.code === code);
}

/** Header (parent) accounts have codes ending in "000". */
export function isHeaderAccount(a: ChartOfAccount): boolean {
  return a.code.endsWith("000");
}

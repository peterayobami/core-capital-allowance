// 🔌 BACKEND: All types in this file are the canonical shapes for the ledger
// domain. The backend ledger service is the source of truth for journals,
// account balances, the trial balance, and the resulting financial statements.
// The frontend mock implementations should be replaced 1-for-1 by API calls.

import type { Period } from "@/lib/services/tax.service";

// ───────────────────────────── Chart of Accounts ─────────────────────────────
export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Revenue"
  | "CostOfSales"
  | "Expense"
  | "TaxExpense";

export type NormalBalance = "Debit" | "Credit";

export interface ChartOfAccount {
  code: string;
  name: string;
  type: AccountType;
  subType: string;
  normalBalance: NormalBalance;
  parentCode?: string;
  isActive: boolean;
  description?: string;
  /** Computed at runtime — never persisted on the record. */
  balance?: number;
}

// ────────────────────────────── Journal Entries ──────────────────────────────
export type JournalStatus = "Draft" | "Posted" | "Void";

export type JournalSource =
  | "Revenue"
  | "Purchase"
  | "Expense"
  | "Asset"
  | "Depreciation"
  | "Payroll"
  | "Manual";

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  reference: string;
  date: string;
  narration: string;
  source: JournalSource;
  sourceId?: string;
  status: JournalStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

// ────────────────────────────── Trial Balance ────────────────────────────────
export interface TrialBalanceRow {
  code: string;
  accountName: string;
  type: AccountType;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalance {
  year: number;
  period: Period;
  rows: TrialBalanceRow[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
}

// ──────────────────────────── Cash Flow Statement ────────────────────────────
export interface CashFlowItem {
  label: string;
  value: number;
  isEditable?: boolean;
  accountRef?: string;
  note?: string;
}

export interface CashFlowSection {
  title: "Operating Activities" | "Investing Activities" | "Financing Activities";
  items: CashFlowItem[];
  subtotal: number;
}

export interface CashFlowStatement {
  year: number;
  sections: CashFlowSection[];
  openingCash: number;
  netChange: number;
  closingCash: number;
}

export interface CFInputs {
  openingCash: number;
  disposalProceeds: number;
  capitalIntroduced: number;
  loanProceeds: number;
  loanRepayment: number;
  dividendsPaid: number;
}

// ──────────────────────────── Balance Sheet ──────────────────────────────────
export interface BalanceSheetItem {
  label: string;
  value: number;
  accountRef?: string;
  isEditable?: boolean;
}

export interface BalanceSheetSection {
  title: string;
  items: BalanceSheetItem[];
  subtotal: number;
}

export interface BalanceSheetStatement {
  year: number;
  assets: {
    currentAssets: BalanceSheetSection;
    nonCurrentAssets: BalanceSheetSection;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: BalanceSheetSection;
    totalLiabilities: number;
  };
  equity: {
    items: BalanceSheetItem[];
    totalEquity: number;
    netProfitAfterTax: number;
    closingRetainedEarnings: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  imbalance: number;
}

export interface BSInputs {
  shareCapital: number;
  retainedEarningsBF: number;
  openingCash: number;
  // Mirrors the financing/disposal inputs that drive cash position
  disposalProceeds: number;
  capitalIntroduced: number;
  loanProceeds: number;
  loanRepayment: number;
  dividendsPaid: number;
}

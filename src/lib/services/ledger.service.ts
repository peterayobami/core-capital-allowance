// 🔌 BACKEND: This entire service is a frontend mock for UI development.
// In production, every function below is replaced by an API call to the backend
// ledger service, which is the single source of truth for journals, account
// balances, the trial balance, and the resulting financial statements.
// No financial computation should be duplicated between frontend and backend.

import {
  COA_ACCOUNTS, REVENUE_CATEGORY_TO_COA, EXPENSE_CATEGORY_TO_COA, findAccount,
} from "@/lib/mock-data/coa";
import {
  REVENUES, PURCHASES, EXPENSES, ASSETS,
} from "@/lib/mock-data/transactions";
import {
  deriveRevenue, derivePurchase, deriveExpense, depreciationFor,
  depreciationAddbackFor, vatTotals, whtTotals, computeTax,
  revenuesIn, purchasesIn, expensesIn, inPeriod, type Period,
} from "@/lib/services/tax.service";
import type {
  ChartOfAccount, JournalEntry, JournalLine, JournalSource,
  TrialBalance, TrialBalanceRow, AccountType,
  CashFlowStatement, CFInputs, BalanceSheetStatement, BSInputs,
} from "@/lib/models/ledger";

export { COA_ACCOUNTS };

// 🔌 BACKEND: Multi-tenant — both VAT (7.5%) and WHT bands (5/10%) and CIT
// bands are Nigerian defaults. Real backend pulls per-tenant tax config.

// ─────────────────────────────────────────────────────────────────────────────
// Journal generation (mock — backend will own this)
// ─────────────────────────────────────────────────────────────────────────────

function lineId(prefix: string, n: number): string {
  return `${prefix}-L${n}`;
}

function pushLine(
  lines: JournalLine[], code: string, debit: number, credit: number, description?: string,
): void {
  if (debit === 0 && credit === 0) return;
  const acct = findAccount(code);
  lines.push({
    id: lineId("JL", lines.length + 1),
    accountCode: code,
    accountName: acct?.name ?? code,
    debit,
    credit,
    description,
  });
}

function totalsOf(lines: JournalLine[]): { totalDebit: number; totalCredit: number } {
  return lines.reduce(
    (acc, l) => ({ totalDebit: acc.totalDebit + l.debit, totalCredit: acc.totalCredit + l.credit }),
    { totalDebit: 0, totalCredit: 0 },
  );
}

let _seqCounter = 0;
function nextRef(year: number): string {
  _seqCounter += 1;
  return `JE-${year}-${_seqCounter.toString().padStart(4, "0")}`;
}

function buildJournal(args: {
  date: string; narration: string; source: JournalSource; sourceId?: string;
  status?: "Posted" | "Draft" | "Void";
  lines: JournalLine[];
}): JournalEntry {
  const year = new Date(args.date).getFullYear();
  const totals = totalsOf(args.lines);
  return {
    id: `JE-${args.source}-${args.sourceId ?? Math.random().toString(36).slice(2)}`,
    reference: nextRef(year),
    date: args.date,
    narration: args.narration,
    source: args.source,
    sourceId: args.sourceId,
    status: args.status ?? "Posted",
    lines: args.lines,
    totalDebit: totals.totalDebit,
    totalCredit: totals.totalCredit,
    createdAt: args.date,
  };
}

/**
 * Build the full journal universe for a given fiscal year (and optional period
 * inside that year). Pure function, deterministic for the mock dataset.
 *
 * 🔌 BACKEND: Replace with `GET /api/journals?year=&period=&page=&status=`.
 */
export function generateJournals(year: number, period: Period = "full"): JournalEntry[] {
  _seqCounter = 0; // reset so each call yields stable refs

  const out: JournalEntry[] = [];

  // ── Revenue ──
  // Dr Accounts Receivable / Cr Revenue (+ Cr VAT Payable, + Dr WHT Receivable)
  for (const r of revenuesIn(year, period)) {
    const lines: JournalLine[] = [];
    const revAccount = REVENUE_CATEGORY_TO_COA[r.category] ?? "4000";
    const netReceivable = r.sales + r.vatAmount - r.whtAmount;
    pushLine(lines, "1200", netReceivable, 0, "Net receivable from customer");
    if (r.isWhtApplicable) pushLine(lines, "1250", r.whtAmount, 0, `WHT ${r.whtRate}% credit`);
    pushLine(lines, revAccount, 0, r.sales, r.description);
    if (r.isTaxableSupply) pushLine(lines, "2200", 0, r.vatAmount, "Output VAT");
    out.push(buildJournal({
      date: r.date, narration: `Revenue: ${r.category} — ${r.customer}`,
      source: "Revenue", sourceId: r.id, lines,
    }));
  }

  // ── Purchases ──
  // Dr Purchases (+ Dr VAT Recoverable) / Cr Accounts Payable (+ Cr WHT Payable)
  for (const p of PURCHASES.map(derivePurchase).filter(p => inPeriod(p.date, year, period))) {
    const lines: JournalLine[] = [];
    pushLine(lines, "5100", p.cost, 0, p.description);
    if (p.isVatApplicable) pushLine(lines, "1260", p.vatAmount, 0, "Input VAT recoverable");
    const payable = p.cost + p.vatAmount - p.whtAmount;
    pushLine(lines, "2100", 0, payable, `Payable to ${p.vendor}`);
    if (p.isWhtApplicable) pushLine(lines, "2300", 0, p.whtAmount, `WHT ${p.whtRate}% withheld`);
    out.push(buildJournal({
      date: p.date, narration: `Purchase: ${p.description} — ${p.vendor}`,
      source: "Purchase", sourceId: p.id, lines,
    }));
  }

  // ── Expenses ──
  for (const e of EXPENSES.map(deriveExpense).filter(e => inPeriod(e.date, year, period))) {
    const lines: JournalLine[] = [];
    const expAccount = EXPENSE_CATEGORY_TO_COA[e.category] ?? "6000";
    pushLine(lines, expAccount, e.cost, 0, e.description);
    if (e.isVatApplicable) pushLine(lines, "1260", e.vatAmount, 0, "Input VAT recoverable");
    const payable = e.cost + e.vatAmount - e.whtAmount;
    pushLine(lines, "2100", 0, payable, `Payable to ${e.supplier}`);
    if (e.isWhtApplicable) pushLine(lines, "2300", 0, e.whtAmount, `WHT ${e.whtRate}% withheld`);
    out.push(buildJournal({
      date: e.date, narration: `Expense: ${e.category} — ${e.supplier}`,
      source: "Expense", sourceId: e.id, lines,
    }));
  }

  // ── Assets (capitalisation) ──
  for (const a of ASSETS.filter(a => inPeriod(a.datePurchased, year, period))) {
    const lines: JournalLine[] = [];
    pushLine(lines, "1500", a.cost, 0, a.description);
    pushLine(lines, "2100", 0, a.cost, "Capital expenditure payable");
    out.push(buildJournal({
      date: a.datePurchased, narration: `Asset capitalisation: ${a.description}`,
      source: "Asset", sourceId: a.id, lines,
    }));
  }

  // ── Depreciation (one annual journal aggregating all assets in the year) ──
  const depTotal = depreciationAddbackFor(year);
  if (depTotal > 0 && (period === "full" || period === "Q4" || period === 12)) {
    const lines: JournalLine[] = [];
    pushLine(lines, "6800", depTotal, 0, "Annual accounting depreciation");
    pushLine(lines, "1600", 0, depTotal, "Accumulated depreciation");
    out.push(buildJournal({
      date: `${year}-12-31`, narration: `Annual depreciation run — FY ${year}`,
      source: "Depreciation", lines,
    }));
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// ─────────────────────────────────────────────────────────────────────────────
// Account balances and Trial Balance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sum of all journal-line activity on a single account for a (year, period).
 * Returns the *period* movement only (debit/credit). Caller combines with
 * opening balances for closing.
 *
 * 🔌 BACKEND: Replace with `GET /api/accounts/balances?year=&period=`.
 */
export function getAccountBalance(code: string, year: number, period: Period = "full"): number {
  const journals = generateJournals(year, period);
  let dr = 0, cr = 0;
  for (const j of journals) {
    for (const l of j.lines) {
      if (l.accountCode === code) { dr += l.debit; cr += l.credit; }
    }
  }
  const acct = findAccount(code);
  return acct?.normalBalance === "Credit" ? cr - dr : dr - cr;
}

function periodMovement(code: string, year: number, period: Period): { dr: number; cr: number } {
  const journals = generateJournals(year, period);
  let dr = 0, cr = 0;
  for (const j of journals) {
    for (const l of j.lines) {
      if (l.accountCode === code) { dr += l.debit; cr += l.credit; }
    }
  }
  return { dr, cr };
}

/**
 * Build the trial balance for a given period. Opening balances come from the
 * cumulative activity of all PRIOR years; period movement is the activity
 * within the requested period.
 *
 * 🔌 BACKEND: Replace with `GET /api/reports/trial-balance?year=&period=`.
 */
export function computeTrialBalance(year: number, period: Period = "full"): TrialBalance {
  const rows: TrialBalanceRow[] = [];

  for (const acct of COA_ACCOUNTS) {
    if (acct.code.endsWith("000")) continue; // skip parent headers

    // Opening = sum of activity in all prior years (full year)
    let openingDr = 0, openingCr = 0;
    for (let y = year - 4; y < year; y++) {
      const m = periodMovement(acct.code, y, "full");
      openingDr += m.dr;
      openingCr += m.cr;
    }
    const periodM = periodMovement(acct.code, year, period);

    let closingDebit = 0, closingCredit = 0;
    if (acct.normalBalance === "Debit") {
      const net = (openingDr + periodM.dr) - (openingCr + periodM.cr);
      closingDebit = Math.max(net, 0);
      closingCredit = Math.max(-net, 0);
    } else {
      const net = (openingCr + periodM.cr) - (openingDr + periodM.dr);
      closingCredit = Math.max(net, 0);
      closingDebit = Math.max(-net, 0);
    }

    const openingNet = acct.normalBalance === "Debit" ? openingDr - openingCr : openingCr - openingDr;
    rows.push({
      code: acct.code,
      accountName: acct.name,
      type: acct.type,
      openingDebit: acct.normalBalance === "Debit" ? Math.max(openingNet, 0) : Math.max(-openingNet, 0),
      openingCredit: acct.normalBalance === "Credit" ? Math.max(openingNet, 0) : Math.max(-openingNet, 0),
      periodDebit: periodM.dr,
      periodCredit: periodM.cr,
      closingDebit, closingCredit,
    });
  }

  const tot = rows.reduce((acc, r) => ({
    totalOpeningDebit: acc.totalOpeningDebit + r.openingDebit,
    totalOpeningCredit: acc.totalOpeningCredit + r.openingCredit,
    totalPeriodDebit: acc.totalPeriodDebit + r.periodDebit,
    totalPeriodCredit: acc.totalPeriodCredit + r.periodCredit,
    totalClosingDebit: acc.totalClosingDebit + r.closingDebit,
    totalClosingCredit: acc.totalClosingCredit + r.closingCredit,
  }), {
    totalOpeningDebit: 0, totalOpeningCredit: 0,
    totalPeriodDebit: 0, totalPeriodCredit: 0,
    totalClosingDebit: 0, totalClosingCredit: 0,
  });

  return {
    year, period, rows,
    ...tot,
    isBalanced: Math.abs(tot.totalClosingDebit - tot.totalClosingCredit) < 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cash Flow (indirect method) — mock
// ─────────────────────────────────────────────────────────────────────────────
// 🔌 BACKEND: Replace with `GET /api/reports/cash-flow?year=`.
// Backend should source operating CF from the P&L with non-cash adjustments
// and investing/financing CF from movements in the relevant ledger accounts.

function totalRevenueFor(year: number): number {
  return revenuesIn(year).reduce((s, r) => s + r.sales, 0);
}
function totalPurchasesFor(year: number): number {
  return purchasesIn(year).reduce((s, p) => s + p.cost, 0);
}
function totalExpensesFor(year: number): number {
  return expensesIn(year).reduce((s, e) => s + e.cost, 0);
}
function totalAssetCostFor(year: number): number {
  return ASSETS.filter(a => new Date(a.datePurchased).getFullYear() === year)
               .reduce((s, a) => s + a.cost, 0);
}

export function computeCashFlow(year: number, inputs: CFInputs): CashFlowStatement {
  const revenue = totalRevenueFor(year);
  const purchases = totalPurchasesFor(year);
  const expenses = totalExpensesFor(year);
  const depreciation = depreciationAddbackFor(year);

  const t = computeTax({
    grossIncome: revenue, costOfSales: purchases, expenses,
    depreciationAddback: depreciation,
    unrecoupedCABF: 0, annualAllowance: 0,
  });
  const netProfitAfterTax = (revenue - purchases - expenses) - t.citPayable - t.developmentLevy;

  // Working capital proxies
  const revenuePrev   = totalRevenueFor(year - 1);
  const purchasesPrev = totalPurchasesFor(year - 1);
  const expensesPrev  = totalExpensesFor(year - 1);

  const arDelta  = 0.40 * (revenue - revenuePrev);                  // (Increase) → outflow
  const apDelta  = 0.30 * ((purchases + expenses) - (purchasesPrev + expensesPrev)); // Increase → inflow
  const vatDelta = vatTotals(year).netVat - vatTotals(year - 1).netVat;
  const whtDelta = whtTotals(year).payable - whtTotals(year - 1).payable;

  const operatingItems = [
    { label: "Net Profit / (Loss) After Tax",                       value: netProfitAfterTax, accountRef: "3200" },
    { label: "Add: Depreciation & Amortisation",                    value: depreciation,      accountRef: "6800",
      note: "Non-cash add-back — accounting depreciation, not Annual Allowance." },
    { label: "(Increase) / Decrease in Accounts Receivable",        value: -arDelta,          accountRef: "1200" },
    { label: "Increase / (Decrease) in Accounts Payable",           value: apDelta,           accountRef: "2100" },
    { label: "Increase / (Decrease) in VAT Payable",                value: vatDelta,          accountRef: "2200" },
    { label: "Increase / (Decrease) in WHT Payable",                value: whtDelta,          accountRef: "2300" },
  ];
  const operatingSubtotal = operatingItems.reduce((s, i) => s + i.value, 0);

  const investingItems = [
    { label: "Purchase of Property, Plant & Equipment",             value: -totalAssetCostFor(year), accountRef: "1500" },
    { label: "Proceeds from Disposal of Assets",                    value: inputs.disposalProceeds,  accountRef: "1500", isEditable: true },
  ];
  const investingSubtotal = investingItems.reduce((s, i) => s + i.value, 0);

  const financingItems = [
    { label: "Capital Introduced / Share Issuance",                 value: inputs.capitalIntroduced, accountRef: "3100", isEditable: true },
    { label: "Loan Proceeds Received",                              value: inputs.loanProceeds,                          isEditable: true },
    { label: "Repayment of Loans",                                  value: -inputs.loanRepayment,                        isEditable: true },
    { label: "Dividends Paid",                                      value: -inputs.dividendsPaid,    accountRef: "3200", isEditable: true },
  ];
  const financingSubtotal = financingItems.reduce((s, i) => s + i.value, 0);

  const netChange = operatingSubtotal + investingSubtotal + financingSubtotal;
  const closingCash = inputs.openingCash + netChange;

  return {
    year,
    sections: [
      { title: "Operating Activities", items: operatingItems, subtotal: operatingSubtotal },
      { title: "Investing Activities", items: investingItems, subtotal: investingSubtotal },
      { title: "Financing Activities", items: financingItems, subtotal: financingSubtotal },
    ],
    openingCash: inputs.openingCash,
    netChange,
    closingCash,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Balance Sheet — mock
// ─────────────────────────────────────────────────────────────────────────────
// 🔌 BACKEND: Replace with `GET /api/reports/balance-sheet?year=`.
// Backend must source closing balances from posted journals, never from
// raw transaction arrays.

export function computeBalanceSheet(year: number, inputs: BSInputs): BalanceSheetStatement {
  const revenue = totalRevenueFor(year);
  const purchases = totalPurchasesFor(year);
  const expenses = totalExpensesFor(year);
  const depreciation = depreciationAddbackFor(year);

  const t = computeTax({
    grossIncome: revenue, costOfSales: purchases, expenses,
    depreciationAddback: depreciation,
    unrecoupedCABF: 0, annualAllowance: 0,
  });
  const netProfitAfterTax = (revenue - purchases - expenses) - t.citPayable - t.developmentLevy;

  // Cash position derived from the same CF inputs the user controls
  const cf = computeCashFlow(year, {
    openingCash: inputs.openingCash,
    disposalProceeds: inputs.disposalProceeds,
    capitalIntroduced: inputs.capitalIntroduced,
    loanProceeds: inputs.loanProceeds,
    loanRepayment: inputs.loanRepayment,
    dividendsPaid: inputs.dividendsPaid,
  });

  // Tax balances
  const vat = vatTotals(year);
  const wht = whtTotals(year);

  // Assets — current
  const cashEq        = Math.max(0, cf.closingCash);
  const accountsRecv  = Math.round(0.40 * revenue);
  const whtReceivable = wht.receivable;
  const vatRecoverable = Math.max(0, -vat.netVat);
  const prepayments   = Math.round(0.05 * expenses);

  const currentAssetsItems = [
    { label: "Cash & Cash Equivalents",      value: cashEq,         accountRef: "1100" },
    { label: "Accounts Receivable",          value: accountsRecv,   accountRef: "1200" },
    { label: "WHT Receivable",               value: whtReceivable,  accountRef: "1250" },
    ...(vatRecoverable > 0 ? [{ label: "VAT Recoverable", value: vatRecoverable, accountRef: "1260" }] : []),
    { label: "Prepayments & Other",          value: prepayments,    accountRef: "1400" },
  ];
  const currentAssetsSubtotal = currentAssetsItems.reduce((s, i) => s + i.value, 0);

  // Assets — non-current
  // PPE cost includes all assets purchased in years <= current year
  let ppeCost = 0;
  for (const a of ASSETS) {
    if (new Date(a.datePurchased).getFullYear() <= year) ppeCost += a.cost;
  }
  // Accumulated depreciation = sum of yearly depreciation up to and including the current year
  let accDep = 0;
  for (const a of ASSETS) {
    for (const e of depreciationFor(a)) {
      if (e.year <= year) accDep += e.depreciation;
    }
  }
  const ppeNbv = Math.max(0, ppeCost - accDep);

  const nonCurrentAssetsItems = [
    { label: "Property, Plant & Equipment — Cost", value: ppeCost,  accountRef: "1500" },
    { label: "Less: Accumulated Depreciation",     value: -accDep,  accountRef: "1600" },
    { label: "Net Book Value",                     value: ppeNbv },
  ];
  const totalAssets = currentAssetsSubtotal + ppeNbv;

  // Liabilities — current
  const ap     = Math.round(0.30 * (purchases + expenses));
  const vatPay = Math.max(0, vat.netVat);
  const whtPay = wht.payable;
  // PAYE: derive a simple proxy — backend will read account 2400 closing balance.
  // 🔌 BACKEND: read account 2400 (PAYE Payable) closing balance.
  const payePay = Math.round(0.05 * expenses);
  const citPay  = t.citPayable;

  const currentLiabilitiesItems = [
    { label: "Accounts Payable",                value: ap,       accountRef: "2100" },
    ...(vatPay > 0 ? [{ label: "VAT Payable", value: vatPay, accountRef: "2200" }] : []),
    { label: "WHT Payable",                     value: whtPay,   accountRef: "2300" },
    { label: "PAYE Payable",                    value: payePay,  accountRef: "2400" },
    { label: "CIT Payable",                     value: citPay,   accountRef: "2500" },
  ];
  const currentLiabilitiesSubtotal = currentLiabilitiesItems.reduce((s, i) => s + i.value, 0);
  const totalLiabilities = currentLiabilitiesSubtotal;

  // Equity
  const closingRetainedEarnings = inputs.retainedEarningsBF + netProfitAfterTax;
  const equityItems = [
    { label: "Share Capital",                 value: inputs.shareCapital,        accountRef: "3100", isEditable: true },
    { label: "Retained Earnings B/F",         value: inputs.retainedEarningsBF,                       isEditable: true },
    { label: "Add: Net Profit / (Loss) AT",   value: netProfitAfterTax },
    { label: "Closing Retained Earnings",     value: closingRetainedEarnings,    accountRef: "3200" },
  ];
  const totalEquity = inputs.shareCapital + closingRetainedEarnings;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const imbalance = totalAssets - totalLiabilitiesAndEquity;

  return {
    year,
    assets: {
      currentAssets: { title: "Current Assets",     items: currentAssetsItems,   subtotal: currentAssetsSubtotal },
      nonCurrentAssets: { title: "Non-Current Assets", items: nonCurrentAssetsItems, subtotal: ppeNbv },
      totalAssets,
    },
    liabilities: {
      currentLiabilities: { title: "Current Liabilities", items: currentLiabilitiesItems, subtotal: currentLiabilitiesSubtotal },
      totalLiabilities,
    },
    equity: {
      items: equityItems,
      totalEquity,
      netProfitAfterTax,
      closingRetainedEarnings,
    },
    totalLiabilitiesAndEquity,
    isBalanced: Math.abs(imbalance) < 1,
    imbalance,
  };
}

/** Convenience: list account-types in display order. */
export const ACCOUNT_TYPE_ORDER: AccountType[] = [
  "Asset", "Liability", "Equity", "Revenue", "CostOfSales", "Expense", "TaxExpense",
];

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  Asset: "Assets",
  Liability: "Liabilities",
  Equity: "Equity",
  Revenue: "Revenue",
  CostOfSales: "Cost of Sales",
  Expense: "Expenses",
  TaxExpense: "Tax Expense",
};

// Re-export types for convenient imports from pages
export type {
  ChartOfAccount, JournalEntry, JournalLine, JournalSource,
  TrialBalance, TrialBalanceRow,
  CashFlowStatement, CFInputs,
  BalanceSheetStatement, BSInputs,
} from "@/lib/models/ledger";

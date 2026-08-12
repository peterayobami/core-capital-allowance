/**
 * Shared tax service.
 *
 * Adapts the existing Revenue / Purchase / Expense / Asset mock data into
 * the canonical computation shapes used across the VAT, WHT, P&L and
 * Company Tax modules.
 *
 * The base store records expose limited tax flags, so this service derives
 * the missing details deterministically (so values are stable per record):
 *   - VAT amount is 7.5% of the base amount when the `vat` flag is true.
 *   - WHT applicability + rate are inferred from `whtPct` (Purchase),
 *     a deterministic hash on the id (Revenue), and the same hash on
 *     Expense records.
 */
import {
  REVENUES, PURCHASES, EXPENSES, ASSETS,
} from "@/lib/mock-data/transactions";
import type {
  RevenueItem, PurchaseItem, ExpenseItem, AssetItem,
} from "@/lib/models/transactions";

// ───────────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────────
export const VAT_RATE = 0.075;
export const DEV_LEVY_RATE = 0.005;

export type Period = "full" | "Q1" | "Q2" | "Q3" | "Q4" | number; // number = 1-12 month
export type CITBand = "Small" | "Medium" | "Large";

// ───────────────────────────────────────────────────────────────────────────────
// Derived record types
// ───────────────────────────────────────────────────────────────────────────────
export interface DerivedRevenue extends RevenueItem {
  isTaxableSupply: boolean;
  vatAmount: number;
  isWhtApplicable: boolean;
  whtRate: number;          // 0 | 5 | 10
  whtAmount: number;
  whtCertificateNumber?: string;
}

export interface DerivedPurchase extends PurchaseItem {
  isVatApplicable: boolean;
  vatAmount: number;
  isWhtApplicable: boolean;
  whtRate: number;
  whtAmount: number;
}

export interface DerivedExpense extends ExpenseItem {
  isVatApplicable: boolean;
  vatAmount: number;
  isWhtApplicable: boolean;
  whtRate: number;
  whtAmount: number;
  isTaxDeductible: boolean;
}

export interface VatTransaction {
  id: string;
  date: string;
  invoiceNumber: string;
  description: string;
  partyName: string;
  sourceType: "Purchase" | "Expense";
  amount: number;
  inputVat: number;
}

export interface WhtTransaction {
  id: string;
  date: string;
  invoiceNumber: string;
  description: string;
  vendorName: string;
  sourceType: "Purchase" | "Expense";
  amount: number;
  whtRate: number;
  whtAmount: number;
}

// ───────────────────────────────────────────────────────────────────────────────
// Deterministic helpers (so derived flags don't change between renders)
// ───────────────────────────────────────────────────────────────────────────────
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// ───────────────────────────────────────────────────────────────────────────────
// Derivers
// ───────────────────────────────────────────────────────────────────────────────
export function deriveRevenue(r: RevenueItem): DerivedRevenue {
  const h = hash(r.id);
  const isTaxableSupply = r.vat;
  const vatAmount = isTaxableSupply ? Math.round(r.sales * VAT_RATE) : 0;

  // WHT: about 60% of revenues attract WHT (deterministic on id)
  const isWhtApplicable = h % 5 !== 0;
  const whtRate = isWhtApplicable ? (h % 2 === 0 ? 5 : 10) : 0;
  const whtAmount = isWhtApplicable ? Math.round(r.sales * (whtRate / 100)) : 0;
  const whtCertificateNumber =
    isWhtApplicable && h % 3 !== 0 ? `WHT/${r.invoiceNo.slice(-6)}/CERT` : undefined;

  return { ...r, isTaxableSupply, vatAmount, isWhtApplicable, whtRate, whtAmount, whtCertificateNumber };
}

export function derivePurchase(p: PurchaseItem): DerivedPurchase {
  const isVatApplicable = p.vat;
  const vatAmount = isVatApplicable ? Math.round(p.cost * VAT_RATE) : 0;
  const whtRate = p.whtPct ?? 0;
  const isWhtApplicable = whtRate > 0;
  const whtAmount = isWhtApplicable ? Math.round(p.cost * (whtRate / 100)) : 0;
  return { ...p, isVatApplicable, vatAmount, isWhtApplicable, whtRate, whtAmount };
}

export function deriveExpense(e: ExpenseItem): DerivedExpense {
  const h = hash(e.id);
  const isVatApplicable = h % 3 !== 0;
  const vatAmount = isVatApplicable ? Math.round(e.cost * VAT_RATE) : 0;
  const isWhtApplicable = h % 4 === 0;
  const whtRate = isWhtApplicable ? (h % 2 === 0 ? 5 : 10) : 0;
  const whtAmount = isWhtApplicable ? Math.round(e.cost * (whtRate / 100)) : 0;
  return {
    ...e, isVatApplicable, vatAmount, isWhtApplicable, whtRate, whtAmount,
    isTaxDeductible: e.deductible,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Period filter
// ───────────────────────────────────────────────────────────────────────────────
function dateOf<T extends { date?: string; datePurchased?: string }>(item: T): string {
  return (item.date ?? item.datePurchased)!;
}

export function inPeriod(iso: string, year: number, period: Period): boolean {
  const d = new Date(iso);
  if (d.getFullYear() !== year) return false;
  const m = d.getMonth() + 1;
  if (period === "full") return true;
  if (period === "Q1") return m <= 3;
  if (period === "Q2") return m >= 4 && m <= 6;
  if (period === "Q3") return m >= 7 && m <= 9;
  if (period === "Q4") return m >= 10;
  return m === period;
}

export function filterByPeriod<T extends { date?: string; datePurchased?: string }>(
  items: T[], year: number, period: Period,
): T[] {
  return items.filter(i => inPeriod(dateOf(i), year, period));
}

// ───────────────────────────────────────────────────────────────────────────────
// Aggregations
// ───────────────────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export interface MonthlyRow {
  month: string;
  outputVat: number; inputVat: number; netVat: number;
  whtReceivable: number; whtPayable: number; whtNet: number;
  revenue: number; purchases: number; expensesTotal: number; netProfit: number;
}

export function aggregateMonthly(year: number): MonthlyRow[] {
  const revs = REVENUES.map(deriveRevenue).filter(r => new Date(r.date).getFullYear() === year);
  const purs = PURCHASES.map(derivePurchase).filter(p => new Date(p.date).getFullYear() === year);
  const exps = EXPENSES.map(deriveExpense).filter(e => new Date(e.date).getFullYear() === year);

  return MONTHS.map((month, i) => {
    const m = i + 1;
    const r = revs.filter(x => new Date(x.date).getMonth() + 1 === m);
    const p = purs.filter(x => new Date(x.date).getMonth() + 1 === m);
    const e = exps.filter(x => new Date(x.date).getMonth() + 1 === m);

    const outputVat = r.reduce((s, x) => s + x.vatAmount, 0);
    const inputVat = p.reduce((s, x) => s + x.vatAmount, 0) + e.reduce((s, x) => s + x.vatAmount, 0);
    const whtReceivable = r.reduce((s, x) => s + x.whtAmount, 0);
    const whtPayable = p.reduce((s, x) => s + x.whtAmount, 0) + e.reduce((s, x) => s + x.whtAmount, 0);
    const revenue = r.reduce((s, x) => s + x.sales, 0);
    const purchases = p.reduce((s, x) => s + x.cost, 0);
    const expensesTotal = e.reduce((s, x) => s + x.cost, 0);

    return {
      month, outputVat, inputVat, netVat: outputVat - inputVat,
      whtReceivable, whtPayable, whtNet: whtReceivable - whtPayable,
      revenue, purchases, expensesTotal,
      netProfit: revenue - purchases - expensesTotal,
    };
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Available years from store
// ───────────────────────────────────────────────────────────────────────────────
export function availableYears(): number[] {
  const ys = new Set<number>();
  for (const r of REVENUES) ys.add(new Date(r.date).getFullYear());
  for (const p of PURCHASES) ys.add(new Date(p.date).getFullYear());
  for (const e of EXPENSES) ys.add(new Date(e.date).getFullYear());
  const arr = Array.from(ys).sort((a, b) => b - a);
  return arr.length ? arr : [new Date().getFullYear()];
}

export function defaultYear(): number {
  return availableYears()[0];
}

// ───────────────────────────────────────────────────────────────────────────────
// Depreciation (very simple straight-line per classification)
// ───────────────────────────────────────────────────────────────────────────────
const CLASS_LIFE: Record<string, number> = {
  "Office Furniture": 5,
  "Computer Equipment": 4,
  "Motor Vehicles": 5,
  "Plant & Machinery": 8,
  "Office Equipment": 5,
  "Building": 25,
};

export interface DepreciationEntry {
  year: number;
  depreciation: number;
  carryingValue: number;
}

export function depreciationFor(asset: AssetItem): DepreciationEntry[] {
  const life = CLASS_LIFE[asset.classification] ?? 5;
  const annual = Math.round(asset.cost / life);
  const startYear = new Date(asset.datePurchased).getFullYear();
  const out: DepreciationEntry[] = [];
  let cv = asset.cost;
  for (let i = 0; i < life; i++) {
    const dep = i === life - 1 ? cv : annual;
    cv = Math.max(0, cv - dep);
    out.push({ year: startYear + i, depreciation: dep, carryingValue: cv });
  }
  return out;
}

export function depreciationAddbackFor(year: number): number {
  let total = 0;
  for (const a of ASSETS) {
    for (const e of depreciationFor(a)) {
      if (e.year === year) total += e.depreciation;
    }
  }
  return total;
}

// ───────────────────────────────────────────────────────────────────────────────
// Core CIT computation
// ───────────────────────────────────────────────────────────────────────────────
export interface TaxComputation {
  adjustedProfit: number;
  totalCAAvailable: number;
  caRelieved: number;
  unrecoupedCF: number;
  assessableIncome: number;
  band: CITBand;
  citRate: number;          // 0, 20, or 30 (percent)
  citPayable: number;
  developmentLevy: number;
  totalTaxPayable: number;
  effectiveTaxRate: number;
}

export function bandFor(grossIncome: number): { band: CITBand; rate: number } {
  if (grossIncome <= 25_000_000) return { band: "Small", rate: 0 };
  if (grossIncome <= 100_000_000) return { band: "Medium", rate: 20 };
  return { band: "Large", rate: 30 };
}

export function computeTax(params: {
  grossIncome: number;
  costOfSales: number;
  expenses: number;
  depreciationAddback: number;
  unrecoupedCABF: number;
  annualAllowance: number;
  balancingAllowance?: number;
  balancingCharge?: number;
}): TaxComputation {
  const {
    grossIncome, costOfSales, expenses, depreciationAddback,
    unrecoupedCABF, annualAllowance,
    balancingAllowance = 0, balancingCharge = 0,
  } = params;

  const adjustedProfit = grossIncome - costOfSales - expenses + depreciationAddback;
  const totalCAAvailable = unrecoupedCABF + annualAllowance + balancingAllowance - balancingCharge;
  const caRelieved = Math.min(totalCAAvailable, Math.max(adjustedProfit, 0));
  const unrecoupedCF = Math.max(totalCAAvailable - caRelieved, 0);
  const assessableIncome = Math.max(adjustedProfit - caRelieved, 0);

  const { band, rate } = bandFor(grossIncome);
  const citPayable = Math.round(assessableIncome * (rate / 100));
  const developmentLevy = Math.round(grossIncome * DEV_LEVY_RATE);
  const totalTaxPayable = citPayable + developmentLevy;
  const effectiveTaxRate = adjustedProfit > 0 ? (totalTaxPayable / adjustedProfit) * 100 : 0;

  return {
    adjustedProfit, totalCAAvailable, caRelieved, unrecoupedCF,
    assessableIncome, band, citRate: rate, citPayable,
    developmentLevy, totalTaxPayable, effectiveTaxRate,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// High-level dataset accessors used by pages
// ───────────────────────────────────────────────────────────────────────────────
export function revenuesIn(year: number, period: Period = "full"): DerivedRevenue[] {
  return REVENUES.map(deriveRevenue).filter(r => inPeriod(r.date, year, period));
}
export function purchasesIn(year: number, period: Period = "full"): DerivedPurchase[] {
  return PURCHASES.map(derivePurchase).filter(p => inPeriod(p.date, year, period));
}
export function expensesIn(year: number, period: Period = "full"): DerivedExpense[] {
  return EXPENSES.map(deriveExpense).filter(e => inPeriod(e.date, year, period));
}

export function vatTotals(year: number, period: Period = "full") {
  const revs = revenuesIn(year, period);
  const purs = purchasesIn(year, period);
  const exps = expensesIn(year, period);
  const taxableSales = revs.filter(r => r.isTaxableSupply).reduce((s, r) => s + r.sales, 0);
  const outputVat = revs.reduce((s, r) => s + r.vatAmount, 0);
  const purchasesVatBase = purs.filter(p => p.isVatApplicable).reduce((s, p) => s + p.cost, 0);
  const purchasesInputVat = purs.reduce((s, p) => s + p.vatAmount, 0);
  const expensesVatBase = exps.filter(e => e.isVatApplicable).reduce((s, e) => s + e.cost, 0);
  const expensesInputVat = exps.reduce((s, e) => s + e.vatAmount, 0);
  const inputVat = purchasesInputVat + expensesInputVat;
  const taxableTxnCount =
    revs.filter(r => r.isTaxableSupply).length +
    purs.filter(p => p.isVatApplicable).length +
    exps.filter(e => e.isVatApplicable).length;
  const totalTxnCount = revs.length + purs.length + exps.length;
  return {
    taxableSales, outputVat,
    purchasesVatBase, purchasesInputVat,
    expensesVatBase, expensesInputVat,
    inputVat, netVat: outputVat - inputVat,
    taxableTxnCount, totalTxnCount,
  };
}

// 🔌 BACKEND: whtTotals().payable → Balance Sheet account 2300 (WHT Payable).
// whtTotals().receivable → Balance Sheet account 1250 (WHT Receivable), credited against CIT on assessment.
// 🔌 BACKEND: computeTax().citPayable → Balance Sheet account 2500 (CIT Payable).
// On payment to FIRS: Dr 2500 CIT Payable / Cr 1100 Cash.
export function whtTotals(year: number, period: Period = "full") {
  const revs = revenuesIn(year, period);
  const purs = purchasesIn(year, period);
  const exps = expensesIn(year, period);

  const receivableBase = revs.filter(r => r.isWhtApplicable).reduce((s, r) => s + r.sales, 0);
  const receivable = revs.reduce((s, r) => s + r.whtAmount, 0);
  const receivable5 = revs.filter(r => r.whtRate === 5).reduce((s, r) => s + r.whtAmount, 0);
  const receivable10 = revs.filter(r => r.whtRate === 10).reduce((s, r) => s + r.whtAmount, 0);

  const payableFromPurchases = purs.reduce((s, p) => s + p.whtAmount, 0);
  const payableFromExpenses = exps.reduce((s, e) => s + e.whtAmount, 0);
  const payable = payableFromPurchases + payableFromExpenses;
  const payable5 =
    purs.filter(p => p.whtRate === 5).reduce((s, p) => s + p.whtAmount, 0) +
    exps.filter(e => e.whtRate === 5).reduce((s, e) => s + e.whtAmount, 0);
  const payable10 =
    purs.filter(p => p.whtRate === 10).reduce((s, p) => s + p.whtAmount, 0) +
    exps.filter(e => e.whtRate === 10).reduce((s, e) => s + e.whtAmount, 0);

  const certificates = revs.filter(r => r.isWhtApplicable && r.whtCertificateNumber).length;

  return {
    receivableBase, receivable, receivable5, receivable10,
    payableFromPurchases, payableFromExpenses, payable, payable5, payable10,
    netPosition: receivable - payable,
    certificates,
  };
}

export function vatTransactionsIn(year: number, period: Period = "full"): VatTransaction[] {
  const purs: VatTransaction[] = purchasesIn(year, period)
    .filter(p => p.isVatApplicable)
    .map(p => ({
      id: p.id, date: p.date, invoiceNumber: p.invoiceNo, description: p.description,
      partyName: p.vendor, sourceType: "Purchase", amount: p.cost, inputVat: p.vatAmount,
    }));
  const exps: VatTransaction[] = expensesIn(year, period)
    .filter(e => e.isVatApplicable)
    .map(e => ({
      id: e.id, date: e.date, invoiceNumber: e.invoiceNo, description: e.description,
      partyName: e.supplier, sourceType: "Expense", amount: e.cost, inputVat: e.vatAmount,
    }));
  return [...purs, ...exps].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function whtPayableTransactionsIn(year: number, period: Period = "full"): WhtTransaction[] {
  const purs: WhtTransaction[] = purchasesIn(year, period)
    .filter(p => p.isWhtApplicable)
    .map(p => ({
      id: p.id, date: p.date, invoiceNumber: p.invoiceNo, description: p.description,
      vendorName: p.vendor, sourceType: "Purchase", amount: p.cost,
      whtRate: p.whtRate, whtAmount: p.whtAmount,
    }));
  const exps: WhtTransaction[] = expensesIn(year, period)
    .filter(e => e.isWhtApplicable)
    .map(e => ({
      id: e.id, date: e.date, invoiceNumber: e.invoiceNo, description: e.description,
      vendorName: e.supplier, sourceType: "Expense", amount: e.cost,
      whtRate: e.whtRate, whtAmount: e.whtAmount,
    }));
  return [...purs, ...exps].sort((a, b) => (a.date < b.date ? 1 : -1));
}

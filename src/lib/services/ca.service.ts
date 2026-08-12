// 🔌 BACKEND: Capital Allowance (Annual Allowance, TWDV) is a TAX concept used for CIT computation.
// Accounting depreciation (used in Cash Flow and Balance Sheet NBV) is computed separately
// from each asset's depreciationMethod and useful life. These two schedules are independent.
// The Balance Sheet must NEVER use TWDV as NBV. The backend must maintain both schedules.
import type { CAYear, TaxComputation } from "@/lib/models/ca";
import { CLASSIFICATIONS, groupColor as _groupColor } from "@/lib/mock-data/ca";

export function formatNGN(n: number, opts: { negate?: boolean } = {}): string {
    const v = Math.abs(n);
    const formatted = v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n < 0 || opts.negate) return `(Γéª${formatted})`;
    return `Γéª${formatted}`;
}

export function formatNGNCompact(n: number): string {
    const v = Math.abs(n);
    if (v >= 1_000_000) return `${n < 0 ? "-" : ""}Γéª${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${n < 0 ? "-" : ""}Γéª${(v / 1_000).toFixed(0)}K`;
    return `${n < 0 ? "-" : ""}Γéª${v.toFixed(0)}`;
}

export function formatPct(n: number): string {
    return `${n.toFixed(1)}%`;
}

export function totalAA(y: CAYear): number {
    return y.rows.reduce((s, r) => s + r.annualAllowance, 0);
}
export function totalPoolCost(y: CAYear): number {
    return y.rows.reduce((s, r) => s + r.poolCost, 0);
}
export function totalTwdvCf(y: CAYear): number {
    return y.rows.reduce((s, r) => s + r.twdvCf, 0);
}
export function totalTwdvBf(y: CAYear): number {
    return y.rows.reduce((s, r) => s + r.twdvBf, 0);
}
export function totalAdditions(y: CAYear): number {
    return y.rows.reduce((s, r) => s + r.additions, 0);
}

export function taxComputation(y: CAYear): TaxComputation & { aa: number } {
    const adjustedProfit = y.grossIncome - y.costOfSales - y.expenses + y.depreciationAddback;
    const aa = totalAA(y);
    const totalCAAvailable = y.unrecoupedBf + aa;
    const caRelieved = Math.min(totalCAAvailable, Math.max(adjustedProfit, 0));
    const unrecoupedCf = totalCAAvailable - caRelieved;
    const assessableIncome = Math.max(adjustedProfit - caRelieved, 0);
    let band: "Small" | "Medium" | "Large", citRate: number;
    if (y.grossIncome <= 25_000_000) { band = "Small"; citRate = 0; }
    else if (y.grossIncome <= 100_000_000) { band = "Medium"; citRate = 20; }
    else { band = "Large"; citRate = 30; }
    const citPayable = Math.round(assessableIncome * (citRate / 100));
    const effectiveTaxRate = adjustedProfit > 0 ? (citPayable / adjustedProfit) * 100 : 0;
    return { adjustedProfit, aa, totalCAAvailable, caRelieved, unrecoupedCf, assessableIncome, band, citRate, citPayable, effectiveTaxRate };
}

export { _groupColor as groupColor };

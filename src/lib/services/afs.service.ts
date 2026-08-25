// 🔌 BACKEND: This service assembles the Audited Financial Statement (AFS) pack
// and the Rev360 filing checklist from computations that already exist in the
// ledger/tax services. In production these become
//   GET /api/filing/afs?year=        (combined 7-part AFS document)
//   GET /api/filing/rev360-pack?year= (Rev360 checklist for CIT annual filing)
// No new tax computation logic lives here — every figure is sourced from the
// existing ledger.service / tax.service computations.

import {
  revenuesIn, purchasesIn, expensesIn, computeTax, bandFor,
  vatTotals, whtTotals, depreciationFor, depreciationAddbackFor,
  type CITBand,
} from "@/lib/services/tax.service";
import { computeBalanceSheet } from "@/lib/services/ledger.service";
import type { BSInputs } from "@/lib/models/ledger";
import { ASSETS } from "@/lib/mock-data/transactions";
import { EMPLOYEES } from "@/lib/mock-data/paye";
import type {
  AFSComponent, ChangesInEquityStatement, ValueAddedStatement,
  FinancialSummary, AfsNote, FilingPack, FilingPackItem, ComparativeRow,
} from "@/lib/models/filing";

// ─────────────────────────────────────────────────────────────────────────────
// AFS components (§2a of the requirements brief) — order is statutory
// ─────────────────────────────────────────────────────────────────────────────
export const AFS_COMPONENTS: AFSComponent[] = [
  { id: "sofp",       no: 1, title: "Statement of Financial Position",    isNewComputation: false },
  { id: "soci",       no: 2, title: "Statement of Comprehensive Income",  isNewComputation: false },
  { id: "socie",      no: 3, title: "Statement of Changes in Equity",     isNewComputation: true },
  { id: "cashflow",   no: 4, title: "Cash Flow Statement",                isNewComputation: false },
  { id: "notes",      no: 5, title: "Notes to the Accounts",              isNewComputation: true },
  { id: "valueadded", no: 6, title: "Statement of Value Added",           isNewComputation: true },
  { id: "finsummary", no: 7, title: "Financial Summary",                  isNewComputation: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared P&L figures (identical inputs to the Balance Sheet / Cash Flow mocks,
// so the AFS always agrees with the existing reports)
// ─────────────────────────────────────────────────────────────────────────────
export interface PnlFigures {
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  expenses: number;
  pbt: number;
  citPayable: number;
  developmentLevy: number;
  tax: number;
  pat: number;
  band: CITBand;
  hasData: boolean;
}

export function pnlFor(year: number): PnlFigures {
  const revenue = revenuesIn(year).reduce((s, r) => s + r.sales, 0);
  const costOfSales = purchasesIn(year).reduce((s, p) => s + p.cost, 0);
  const expenses = expensesIn(year).reduce((s, e) => s + e.cost, 0);
  const grossProfit = revenue - costOfSales;
  const pbt = grossProfit - expenses;
  const t = computeTax({
    grossIncome: revenue, costOfSales, expenses,
    depreciationAddback: depreciationAddbackFor(year),
    unrecoupedCABF: 0, annualAllowance: 0,
  });
  const tax = t.citPayable + t.developmentLevy;
  return {
    revenue, costOfSales, grossProfit, expenses, pbt,
    citPayable: t.citPayable, developmentLevy: t.developmentLevy,
    tax, pat: pbt - tax, band: t.band,
    hasData: revenue + costOfSales + expenses > 0,
  };
}

/** Annual payroll cost (salaries, allowances) from the PAYE module — used by
 *  the Statement of Value Added. Constant headcount across mock years. */
export function payrollCostFor(_year: number): number {
  return EMPLOYEES.reduce(
    (s, e) => s + e.profile.basic + e.profile.housing + e.profile.transport + e.profile.other,
    0,
  );
}

/** Resolve the Small/Medium/Large classification shown across the module. */
export function resolveClassification(
  year: number,
  setting: "Small" | "Medium" | "Large" | "Auto",
): CITBand {
  if (setting !== "Auto") return setting;
  return bandFor(pnlFor(year).revenue).band;
}

/** Fingerprint of the figures that feed the AFS — used to detect when
 *  underlying data changed after a pack was generated (historical access §3.5). */
export function dataFingerprint(year: number): number {
  const p = pnlFor(year);
  return Math.round(
    p.revenue + p.costOfSales + p.expenses +
    depreciationAddbackFor(year) + p.citPayable + p.developmentLevy,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Statement of Changes in Equity (new computation)
// ─────────────────────────────────────────────────────────────────────────────
export function computeChangesInEquity(
  year: number,
  inputs: { shareCapital: number; retainedEarningsBF: number; dividendsPaid: number },
): ChangesInEquityStatement {
  const cur = pnlFor(year);
  const prior = pnlFor(year - 1);

  const closingRE = inputs.retainedEarningsBF + cur.pat - inputs.dividendsPaid;
  const rows = [
    { label: `Balance at 1 January ${year}`, shareCapital: inputs.shareCapital, retainedEarnings: inputs.retainedEarningsBF, total: inputs.shareCapital + inputs.retainedEarningsBF },
    { label: "Profit / (loss) for the year", shareCapital: null, retainedEarnings: cur.pat, total: cur.pat },
    ...(inputs.dividendsPaid > 0
      ? [{ label: "Dividends paid", shareCapital: null, retainedEarnings: -inputs.dividendsPaid, total: -inputs.dividendsPaid }]
      : []),
    { label: `Balance at 31 December ${year}`, shareCapital: inputs.shareCapital, retainedEarnings: closingRE, total: inputs.shareCapital + closingRE, bold: true, total: true },
  ];

  // Prior-year comparative: opening RE rolls back by the prior year's profit.
  const priorOpeningRE = inputs.retainedEarningsBF - prior.pat;
  const priorRows = [
    { label: `Balance at 1 January ${year - 1}`, shareCapital: inputs.shareCapital, retainedEarnings: priorOpeningRE, total: inputs.shareCapital + priorOpeningRE },
    { label: "Profit / (loss) for the year", shareCapital: null, retainedEarnings: prior.pat, total: prior.pat },
    { label: `Balance at 31 December ${year - 1}`, shareCapital: inputs.shareCapital, retainedEarnings: inputs.retainedEarningsBF, total: inputs.shareCapital + inputs.retainedEarningsBF, bold: true, total: true },
  ];

  return { year, rows, priorRows, hasPrior: prior.hasData };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Statement of Value Added (new computation)
// ─────────────────────────────────────────────────────────────────────────────
export function computeValueAdded(
  year: number,
  inputs: { dividendsPaid: number },
): ValueAddedStatement {
  const build = (y: number) => {
    const p = pnlFor(y);
    const boughtIn = p.costOfSales + p.expenses; // bought-in materials & services
    const payroll = payrollCostFor(y);
    const valueAdded = p.revenue - boughtIn;
    const government = p.tax;
    const providers = inputs.dividendsPaid; // dividends + interest (interest = 0 in mock)
    // Retained-in-business is the balancing figure so the statement always ties out.
    const retained = valueAdded - payroll - government - providers;
    return { p, boughtIn, payroll, valueAdded, government, providers, retained };
  };

  const c = build(year);
  const pr = pnlFor(year - 1).hasData ? build(year - 1) : null;
  const pct = (v: number, base: number) => (base > 0 ? Math.round((v / base) * 1000) / 10 : 0);

  const applied: ValueAddedStatement["applied"] = [
    { label: "Turnover", value: c.p.revenue, prior: pr?.p.revenue ?? null, noteRef: true } as ValueAddedStatement["applied"][number],
    { label: "Bought-in materials and services", value: -c.boughtIn, prior: pr ? -pr.boughtIn : null },
    { label: "Value Added", value: c.valueAdded, prior: pr?.valueAdded ?? null, bold: true, total: true, pct: 100, priorPct: pr ? 100 : undefined },
  ];

  const distributed: ValueAddedStatement["distributed"] = [
    {
      label: "Employees (salaries, pensions & benefits)", value: c.payroll, prior: pr?.payroll ?? null,
      pct: pct(c.payroll, c.valueAdded), priorPct: pr ? pct(pr.payroll, pr.valueAdded) : undefined,
    },
    {
      label: "Government (income tax & levies)", value: c.government, prior: pr?.government ?? null,
      pct: pct(c.government, c.valueAdded), priorPct: pr ? pct(pr.government, pr.valueAdded) : undefined,
    },
    {
      label: "Providers of capital (dividends & interest)", value: c.providers, prior: pr?.providers ?? null,
      pct: pct(c.providers, c.valueAdded), priorPct: pr ? pct(pr.providers, pr.valueAdded) : undefined,
    },
    {
      label: "Retained in the business", value: c.retained, prior: pr?.retained ?? null, bold: true,
      pct: pct(c.retained, c.valueAdded), priorPct: pr ? pct(pr.retained, pr.valueAdded) : undefined,
    },
    {
      label: "— Depreciation & amortisation", value: depreciationAddbackFor(year), prior: pr ? depreciationAddbackFor(year - 1) : null, indent: 1,
    },
    {
      label: "— Profit retained for expansion", value: c.retained - depreciationAddbackFor(year), prior: pr ? pr.retained - depreciationAddbackFor(year - 1) : null, indent: 1,
    },
    {
      label: "Value Distributed", value: c.valueAdded, prior: pr?.valueAdded ?? null, bold: true, total: true, pct: 100, priorPct: pr ? 100 : undefined,
    },
  ];

  return { year, hasPrior: pr !== null, applied, distributed };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Financial Summary (five-year) — classification visible per year
// ─────────────────────────────────────────────────────────────────────────────
export function computeFinancialSummary(
  year: number,
  openingFor: (y: number) => BSInputs,
): FinancialSummary {
  const years = [year - 4, year - 3, year - 2, year - 1, year];
  const cols = years.map((y) => {
    const p = pnlFor(y);
    const bs = computeBalanceSheet(y, openingFor(y));
    return {
      p,
      totalAssets: bs.assets.totalAssets,
      totalLiabilities: bs.liabilities.totalLiabilities,
      totalEquity: bs.equity.totalEquity,
    };
  });

  return {
    years,
    bands: cols.map((c) => (c.p.hasData ? bandFor(c.p.revenue).band : "—")),
    rows: [
      { label: "Turnover", values: cols.map((c) => c.p.revenue) },
      { label: "Profit / (loss) before taxation", values: cols.map((c) => c.p.pbt) },
      { label: "Taxation", values: cols.map((c) => -c.p.tax) },
      { label: "Profit / (loss) after taxation", values: cols.map((c) => c.p.pat), bold: true },
      { label: "Total assets", values: cols.map((c) => c.totalAssets) },
      { label: "Total liabilities", values: cols.map((c) => -c.totalLiabilities) },
      { label: "Net assets / Total equity", values: cols.map((c) => c.totalEquity), bold: true },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Notes to the Accounts (new computation) — cross-referenced by the
//    primary statements via note numbers
// ─────────────────────────────────────────────────────────────────────────────
function groupSum<T>(items: T[], key: (t: T) => string, val: (t: T) => number): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    m.set(k, (m.get(k) ?? 0) + val(it));
  }
  return m;
}

export function computeNotes(year: number): AfsNote[] {
  const prior = year - 1;
  const hasPrior = pnlFor(prior).hasData;
  const P = (v: number) => (hasPrior ? v : null);

  // Note 1 — Revenue by category
  const revCur = groupSum(revenuesIn(year), (r) => r.category, (r) => r.sales);
  const revPrior = groupSum(revenuesIn(prior), (r) => r.category, (r) => r.sales);
  const revRows: ComparativeRow[] = Array.from(revCur.entries()).map(([cat, v]) => ({
    label: cat, value: v, prior: P(revPrior.get(cat) ?? 0),
  }));
  revRows.push({
    label: "Total revenue", value: pnlFor(year).revenue, prior: P(pnlFor(prior).revenue), bold: true, total: true,
  });

  // Note 2 — Cost of sales
  const cosRows: ComparativeRow[] = [
    { label: "Purchases of goods and direct materials", value: pnlFor(year).costOfSales, prior: P(pnlFor(prior).costOfSales), bold: true, total: true },
  ];

  // Note 3 — Operating expenses by category
  const expCur = groupSum(expensesIn(year), (e) => e.category, (e) => e.cost);
  const expPrior = groupSum(expensesIn(prior), (e) => e.category, (e) => e.cost);
  const expRows: ComparativeRow[] = Array.from(expCur.entries()).map(([cat, v]) => ({
    label: cat, value: v, prior: P(expPrior.get(cat) ?? 0),
  }));
  expRows.push({
    label: "Personnel costs (see Note 3a)", value: payrollCostFor(year), prior: P(payrollCostFor(prior)),
  });
  expRows.push({
    label: "Total operating expenses", value: pnlFor(year).expenses, prior: P(pnlFor(prior).expenses), bold: true, total: true,
  });

  // Note 4 — Property, Plant & Equipment
  const ppeOf = (y: number) => {
    const additions = ASSETS.filter((a) => new Date(a.datePurchased).getFullYear() === y)
      .reduce((s, a) => s + a.cost, 0);
    const costCf = ASSETS.filter((a) => new Date(a.datePurchased).getFullYear() <= y)
      .reduce((s, a) => s + a.cost, 0);
    const charge = depreciationAddbackFor(y);
    let accCf = 0;
    for (const a of ASSETS) for (const e of depreciationFor(a)) if (e.year <= y) accCf += e.depreciation;
    return { additions, costBf: costCf - additions, costCf, charge, accBf: accCf - charge, accCf, nbv: costCf - accCf };
  };
  const pc = ppeOf(year);
  const pp = ppeOf(prior);
  const ppeRows: ComparativeRow[] = [
    { label: "Cost — brought forward", value: pc.costBf, prior: P(pp.costBf) },
    { label: "Additions during the year", value: pc.additions, prior: P(pp.additions) },
    { label: "Cost — carried forward", value: pc.costCf, prior: P(pp.costCf), bold: true, total: true },
    { label: "Accumulated depreciation — brought forward", value: -pc.accBf, prior: P(-pp.accBf) },
    { label: "Charge for the year", value: -pc.charge, prior: P(-pp.charge) },
    { label: "Accumulated depreciation — carried forward", value: -pc.accCf, prior: P(-pp.accCf), bold: true, total: true },
    { label: "Net book value", value: pc.nbv, prior: P(pp.nbv), bold: true, total: true },
  ];

  // Note 5 — Trade & other receivables (mirrors Balance Sheet proxies)
  const vatC = vatTotals(year); const vatP = vatTotals(prior);
  const whtC = whtTotals(year); const whtP = whtTotals(prior);
  const recvRows: ComparativeRow[] = [
    { label: "Trade receivables", value: Math.round(0.40 * pnlFor(year).revenue), prior: P(Math.round(0.40 * pnlFor(prior).revenue)) },
    { label: "WHT receivable (credit notes)", value: whtC.receivable, prior: P(whtP.receivable) },
    ...(Math.max(0, -vatC.netVat) > 0
      ? [{ label: "VAT recoverable", value: Math.max(0, -vatC.netVat), prior: P(Math.max(0, -vatP.netVat)) }]
      : []),
    { label: "Prepayments & other receivables", value: Math.round(0.05 * pnlFor(year).expenses), prior: P(Math.round(0.05 * pnlFor(prior).expenses)) },
  ];

  // Note 6 — Trade & other payables (mirrors Balance Sheet proxies)
  const payRows: ComparativeRow[] = [
    { label: "Trade payables", value: Math.round(0.30 * (pnlFor(year).costOfSales + pnlFor(year).expenses)), prior: P(Math.round(0.30 * (pnlFor(prior).costOfSales + pnlFor(prior).expenses))) },
    ...(Math.max(0, vatC.netVat) > 0
      ? [{ label: "VAT payable", value: Math.max(0, vatC.netVat), prior: P(Math.max(0, vatP.netVat)) }]
      : []),
    { label: "WHT payable", value: whtC.payable, prior: P(whtP.payable) },
    { label: "PAYE payable", value: Math.round(0.05 * pnlFor(year).expenses), prior: P(Math.round(0.05 * pnlFor(prior).expenses)) },
    { label: "Company income tax payable", value: pnlFor(year).citPayable, prior: P(pnlFor(prior).citPayable) },
  ];

  // Note 7 — Taxation
  const tC = pnlFor(year); const tP = pnlFor(prior);
  const taxRows: ComparativeRow[] = [
    { label: `Company income tax (${tC.band} company band)`, value: tC.citPayable, prior: P(tP.citPayable) },
    { label: "Development levy", value: tC.developmentLevy, prior: P(tP.developmentLevy) },
    { label: "Income tax charge for the year", value: tC.tax, prior: P(tP.tax), bold: true, total: true },
    { label: "WHT credit notes available for offset (memo)", value: whtC.receivable, prior: P(whtP.receivable), indent: 1 },
  ];

  return [
    { no: 1, title: "Revenue", rows: revRows },
    { no: 2, title: "Cost of Sales", rows: cosRows },
    {
      no: 3, title: "Operating Expenses", rows: expRows,
      narrative: "Personnel costs are disclosed separately in the Statement of Value Added and are administered through the PAYE module.",
    },
    { no: 4, title: "Property, Plant & Equipment", rows: ppeRows },
    { no: 5, title: "Trade & Other Receivables", rows: recvRows },
    { no: 6, title: "Trade & Other Payables", rows: payRows },
    {
      no: 7, title: "Taxation", rows: taxRows,
      narrative: "The income tax charge comprises Company Income Tax and the Development Levy computed under current Nigerian tax law. WHT credit notes are applied against the assessed liability on filing.",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Rev360 Filing Pack (§2b / §3.3) — a checklist that can change independently
// of the AFS. Add/remove items here as NRS changes Rev360's requirements.
// ─────────────────────────────────────────────────────────────────────────────
export function buildFilingPack(
  year: number,
  citSetting: "Small" | "Medium" | "Large" | "Auto",
): FilingPack {
  const classification = resolveClassification(year, citSetting);
  const isSmall = classification === "Small";

  const items: FilingPackItem[] = [
    {
      id: "afs",
      title: "Audited Financial Statements (unsigned)",
      description:
        "The full seven-part statutory account pack for the year. Core Ledger generates it unsigned — an ICAN-licensed auditor signs it outside the platform before you upload.",
      status: "ready",
      route: "/filing/audited-statements",
      actionLabel: "Open AFS",
    },
    {
      id: "cit",
      title: "Company Income Tax computation",
      description: "Adjusting-profit computation showing the CIT band, capital allowance relief and tax payable for the year of assessment.",
      status: "ready",
      route: "/taxation/income-taxes",
      actionLabel: "Open CIT Computation",
    },
    {
      id: "ca",
      title: "Capital Allowance schedule",
      description: "Pool-by-pool capital allowance schedule (TWDV B/F, additions, allowances, TWDV C/F) supporting the CIT computation.",
      status: "ready",
      route: "/taxation/capital-allowance/schedule",
      actionLabel: "Open CA Schedule",
    },
    {
      id: "wht",
      title: "WHT remittance evidence & credit notes",
      description: "Withholding tax deducted at source during the year — both remitted on vendors' behalf and credit notes receivable against your CIT.",
      status: "ready",
      route: "/taxation/wht",
      actionLabel: "Open WHT Report",
    },
    {
      id: "vat",
      title: "VAT returns evidence",
      description: "Monthly output/input VAT workings and net VAT remitted during the year.",
      status: "ready",
      route: "/taxation/vat",
      actionLabel: "Open VAT Report",
    },
    {
      id: "paye",
      title: "PAYE remittance evidence",
      description: "Pay-as-you-earn deductions remitted to the state IRS for employees during the year.",
      status: "ready",
      route: "/taxation/paye/remittance",
      actionLabel: "Open PAYE Remittance",
    },
    {
      id: "devlevy",
      title: "Development Levy computation",
      description: "Levy on assessable profit, payable alongside CIT.",
      status: isSmall ? "not_applicable" : "ready",
      statusNote: isSmall
        ? "Your company qualifies as a Small Company this year — the Development Levy does not apply."
        : undefined,
      route: isSmall ? undefined : "/taxation/income-taxes",
      actionLabel: isSmall ? undefined : "View in CIT Computation",
    },
    {
      id: "cac",
      title: "CAC status report & TIN documentation",
      description: "Corporate Affairs Commission status report and Tax Identification Number evidence, obtained from CAC / JTB portals.",
      status: "external",
      statusNote: "Prepared outside Core Ledger — obtain from the CAC portal and upload manually to Rev360.",
    },
  ];

  return {
    year,
    classification,
    items,
    readyCount: items.filter((i) => i.status === "ready").length,
  };
}

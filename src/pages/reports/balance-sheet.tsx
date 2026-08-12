import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ReportKpi, ReportKpiStrip, PageCard, StatementRow, SectionHeading,
} from "@/components/reports/ReportPrimitives";
import { MissingDataBanner, BalanceBanner, type MissingItem } from "@/components/reports/MissingDataBanner";
import { YearSelect } from "@/components/reports/PeriodFilter";
import { Button } from "@/components/ui/button";
import { Scale, Boxes, Layers, Wallet, Printer } from "lucide-react";
import { computeBalanceSheet } from "@/lib/services/ledger.service";
import type { BSInputs } from "@/lib/models/ledger";
import { defaultYear } from "@/lib/services/tax.service";
import { formatNGN } from "@/lib/utils/format";
import { selectOpeningBalance } from "@/stores/org-settings.store";
import { toast } from "sonner";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip,
} from "recharts";
import { abbr, MoneyTooltip } from "@/pages/taxation/Vat";

const FMT = (n: number) => n < 0 ? `(${formatNGN(Math.abs(n))})` : formatNGN(n);

export default function BalanceSheetPage() {
  const [year, setYear] = useState<number>(defaultYear());

  const ob = selectOpeningBalance(year);
  const inputs: BSInputs = {
    shareCapital: ob.shareCapital,
    retainedEarningsBF: ob.retainedEarningsBF,
    openingCash: ob.openingCash,
    disposalProceeds: 0,
    capitalIntroduced: 0,
    loanProceeds: 0,
    loanRepayment: 0,
    dividendsPaid: 0,
  };

  const bs = useMemo(() => computeBalanceSheet(year, inputs), [year, inputs]);

  const ca = bs.assets.currentAssets;
  const cl = bs.liabilities.currentLiabilities;
  const workingCapital = ca.subtotal - cl.subtotal;

  const missing: MissingItem[] = [];
  if (ob.openingCash === 0) missing.push({ field: `Opening Cash for FY${year} has not been set.` });
  if (ob.shareCapital === 0) missing.push({ field: "Share Capital has not been entered." });
  if (ob.retainedEarningsBF === 0)
    missing.push({ field: `Retained Earnings (brought forward) for FY${year} is not set.` });

  // Asset composition
  const findAsset = (label: string) => ca.items.find(i => i.label.includes(label))?.value ?? 0;
  const ppeNbv = bs.assets.nonCurrentAssets.subtotal;
  const otherCA = Math.max(0, ca.subtotal - findAsset("Cash") - findAsset("Receivable") - findAsset("WHT"));
  const assetComp = [
    { name: "Cash & Bank",         value: findAsset("Cash"),       color: "hsl(var(--success))" },
    { name: "Accounts Receivable", value: findAsset("Receivable"), color: "hsl(var(--primary))" },
    { name: "WHT Receivable",      value: findAsset("WHT"),        color: "#0EA5E9" },
    { name: "Fixed Assets (NBV)",  value: ppeNbv,                  color: "#6366F1" },
    { name: "Other Current",       value: otherCA,                 color: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0);

  const taxLiab = cl.items
    .filter(i => /VAT|WHT|PAYE|CIT/.test(i.label))
    .reduce((s, i) => s + i.value, 0);
  const ap = cl.items.find(i => i.label.includes("Payable") && !/VAT|WHT|PAYE|CIT/.test(i.label))?.value ?? 0;
  const fundComp = [
    { name: "Accounts Payable", value: ap,                       color: "hsl(var(--warning))" },
    { name: "Tax Liabilities",  value: taxLiab,                  color: "hsl(var(--danger))" },
    { name: "Equity",           value: bs.equity.totalEquity,    color: "hsl(var(--success))" },
  ].filter(d => d.value > 0);

  return (
    <AppShell title="Balance Sheet">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reports</div>
            <h1 className="text-xl font-semibold mt-1">Balance Sheet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Statement of Financial Position — As at 31 Dec {year}.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <YearSelect value={year} onChange={setYear} />
            <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
              <Printer className="h-4 w-4 mr-1.5" /> Export
            </Button>
          </div>
        </header>

        <ReportKpiStrip>
          <ReportKpi label="Total Assets" value={formatNGN(bs.assets.totalAssets)}
            hint="Current + Non-current" icon={Boxes} tone="primary" />
          <ReportKpi label="Total Liabilities" value={formatNGN(bs.liabilities.totalLiabilities)}
            hint="All obligations" icon={Layers} tone="warning" />
          <ReportKpi label="Total Equity" value={formatNGN(bs.equity.totalEquity)}
            hint="Capital + RE" icon={Scale} tone="success" />
          <ReportKpi label="Working Capital" value={FMT(workingCapital)}
            hint="Current Assets − Current Liabilities"
            icon={Wallet} tone={workingCapital >= 0 ? "success" : "danger"} />
        </ReportKpiStrip>

        <BalanceBanner
          balanced={bs.isBalanced}
          imbalance={bs.imbalance}
          message={bs.isBalanced
            ? "Assets = Liabilities + Equity"
            : "Balance Sheet does not balance"}
        />

        {missing.length > 0 && <MissingDataBanner items={missing} />}

        {/* Two donuts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutCard
            title="Asset Composition"
            data={assetComp}
            total={bs.assets.totalAssets}
          />
          <DonutCard
            title="Funding Structure"
            data={fundComp}
            total={bs.totalLiabilitiesAndEquity}
          />
        </div>

        {/* Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PageCard title="Assets">
            <SectionHeading>Current Assets</SectionHeading>
            {bs.assets.currentAssets.items.map((it, i) => (
              <StatementRow key={i} label={it.label} value={it.value === 0 ? "—" : FMT(it.value)}
                indent={1} negative={it.value < 0} />
            ))}
            <StatementRow label="Total Current Assets" value={formatNGN(bs.assets.currentAssets.subtotal)}
              total bold />

            <SectionHeading>Non-Current Assets</SectionHeading>
            {bs.assets.nonCurrentAssets.items.map((it, i) => (
              <StatementRow key={i} label={it.label} value={it.value === 0 ? "—" : FMT(it.value)}
                indent={1} negative={it.value < 0}
                muted={it.label.startsWith("Less")} bold={it.label === "Net Book Value"} />
            ))}

            <div className="mt-5 pt-4 border-t-2 border-border-strong">
              <StatementRow label="TOTAL ASSETS" value={formatNGN(bs.assets.totalAssets)} large />
            </div>
          </PageCard>

          <PageCard title="Liabilities & Equity">
            <SectionHeading>Current Liabilities</SectionHeading>
            {bs.liabilities.currentLiabilities.items.map((it, i) => (
              <StatementRow key={i} label={it.label} value={it.value === 0 ? "—" : FMT(it.value)}
                indent={1} negative={it.value < 0} />
            ))}
            <StatementRow label="Total Liabilities" value={formatNGN(bs.liabilities.totalLiabilities)}
              total bold />

            <SectionHeading>Equity</SectionHeading>
            {bs.equity.items.map((it, i) => (
              <StatementRow key={i} label={it.label} value={it.value === 0 ? "—" : FMT(it.value)}
                indent={1} negative={it.value < 0}
                bold={it.label.includes("Closing")}
                muted={it.label.includes("Add:")} />
            ))}
            <StatementRow label="Total Equity" value={formatNGN(bs.equity.totalEquity)}
              total bold />

            <div className="mt-5 pt-4 border-t-2 border-border-strong">
              <StatementRow label="TOTAL LIABILITIES & EQUITY"
                value={formatNGN(bs.totalLiabilitiesAndEquity)} large />
            </div>
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}

function DonutCard({
  title, data, total,
}: {
  title: string;
  data: Array<{ name: string; value: number; color: string }>;
  total: number;
}) {
  return (
    <PageCard title={title}>
      <div style={{ width: "100%", height: 240 }} className="relative">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name"
              innerRadius="60%" outerRadius="88%" paddingAngle={1}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <RTooltip content={<MoneyTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="mono text-[14px] font-semibold">₦{abbr(total)}</div>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 max-h-[140px] overflow-auto pr-1">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="mono text-muted-foreground text-[11px] shrink-0">
                {formatNGN(d.value)} · {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </PageCard>
  );
}

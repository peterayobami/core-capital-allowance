import { OrgSettingsShell } from "@/components/settings/OrgSettingsShell";
import { PageCard, SectionHeading } from "@/components/reports/ReportPrimitives";
import { useOrgSettings } from "@/stores/org-settings.store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { COA_ACCOUNTS } from "@/lib/mock-data/coa";
import { isHeaderAccount } from "@/lib/mock-data/coa";
import { formatNGN } from "@/lib/utils/format";

export default function OpeningBalancesPage() {
  const fiscalYears = useOrgSettings(s => s.fiscalYears);
  const openingBalances = useOrgSettings(s => s.openingBalances);
  const setOpeningBalance = useOrgSettings(s => s.setOpeningBalance);
  const addCustomOpeningRow = useOrgSettings(s => s.addCustomOpeningRow);
  const removeCustomOpeningRow = useOrgSettings(s => s.removeCustomOpeningRow);

  const [activeYear, setActiveYear] = useState<number>(
    fiscalYears.find(y => y.status === "active")?.year ?? fiscalYears[0]?.year ?? new Date().getFullYear()
  );
  const fy = fiscalYears.find(y => y.year === activeYear);
  const isClosed = fy?.status === "closed";
  const ob = openingBalances[activeYear] ?? {
    openingCash: 0, shareCapital: 0, retainedEarningsBF: 0,
    accountsReceivable: 0, accountsPayable: 0, customRows: [],
  };

  const [newAcct, setNewAcct] = useState("");
  const [newAmt, setNewAmt] = useState(0);

  return (
    <OrgSettingsShell title="Opening Balances">
      <p className="text-[13px] text-muted-foreground mb-5 -mt-2">
        Single source of truth for all brought-forward values used by financial reports
        (Profit &amp; Loss, Balance Sheet, Cash Flow).
      </p>

      <PageCard
        title={`Opening Balances — FY ${activeYear}`}
        action={
          <div className="flex items-center gap-3">
            {isClosed && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Closed (read-only)
              </span>
            )}
            <Select value={String(activeYear)} onValueChange={v => setActiveYear(Number(v))}>
              <SelectTrigger className="h-9 w-[140px] mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                {fiscalYears.map(y => (
                  <SelectItem key={y.year} value={String(y.year)}>FY {y.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <SectionHeading>Cash &amp; Bank</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <BalField
            label="Opening Cash &amp; Bank Balance" helper="Feeds Cash Flow Statement & Balance Sheet account 1100"
            value={ob.openingCash} disabled={isClosed}
            onChange={v => setOpeningBalance(activeYear, { openingCash: v })}
          />
        </div>

        <SectionHeading>Equity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <BalField
            label="Share Capital" helper="Account 3100 — Balance Sheet equity section"
            value={ob.shareCapital} disabled={isClosed}
            onChange={v => setOpeningBalance(activeYear, { shareCapital: v })}
          />
          <BalField
            label="Retained Earnings Brought Forward" helper="Account 3200 — closing RE of prior year"
            value={ob.retainedEarningsBF} disabled={isClosed}
            onChange={v => setOpeningBalance(activeYear, { retainedEarningsBF: v })}
          />
        </div>

        <SectionHeading>Other Opening Balances (optional — for migration)</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <BalField
            label="Accounts Receivable" helper="Account 1200"
            value={ob.accountsReceivable} disabled={isClosed}
            onChange={v => setOpeningBalance(activeYear, { accountsReceivable: v })}
          />
          <BalField
            label="Accounts Payable" helper="Account 2100"
            value={ob.accountsPayable} disabled={isClosed}
            onChange={v => setOpeningBalance(activeYear, { accountsPayable: v })}
          />
        </div>

        <SectionHeading>Custom Account Balances</SectionHeading>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[280px]">Account</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Amount (₦)</th>
                <th className="w-12 py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {ob.customRows.length === 0 && (
                <tr><td colSpan={3} className="py-4 px-3 text-center text-[12.5px] text-muted-foreground">
                  No custom opening balances yet.
                </td></tr>
              )}
              {ob.customRows.map(row => {
                const acct = COA_ACCOUNTS.find(a => a.code === row.accountCode);
                return (
                  <tr key={row.id} className="border-b border-border/50">
                    <td className="py-2 px-3 mono">
                      {row.accountCode} · <span className="font-medium">{acct?.name ?? "Unknown"}</span>
                    </td>
                    <td className="py-2 px-3 mono text-right">{formatNGN(row.amount)}</td>
                    <td className="py-2 px-3">
                      <button
                        disabled={isClosed}
                        onClick={() => removeCustomOpeningRow(activeYear, row.id)}
                        className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!isClosed && (
                <tr className="border-b border-border bg-secondary/30">
                  <td className="py-2 px-3">
                    <Select value={newAcct} onValueChange={setNewAcct}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select account…" /></SelectTrigger>
                      <SelectContent>
                        {COA_ACCOUNTS.filter(a => !isHeaderAccount(a)).map(a => (
                          <SelectItem key={a.code} value={a.code}>
                            <span className="mono">{a.code}</span> · {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-3">
                    <Input type="number" className="mono text-right h-9" value={newAmt}
                      onChange={e => setNewAmt(Number(e.target.value) || 0)} />
                  </td>
                  <td className="py-2 px-3">
                    <Button size="sm" className="h-9"
                      onClick={() => {
                        if (!newAcct) { toast.error("Select an account"); return; }
                        addCustomOpeningRow(activeYear, { accountCode: newAcct, amount: newAmt });
                        setNewAcct(""); setNewAmt(0);
                        toast.success("Opening balance row added");
                      }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11.5px] text-muted-foreground mt-5 leading-relaxed">
          🔌 These values seed the trial balance opening columns and are used by all report
          computations. Once a fiscal year is closed, its opening balances become read-only.
        </p>
      </PageCard>
    </OrgSettingsShell>
  );
}

function BalField({
  label, helper, value, onChange, disabled,
}: {
  label: string; helper?: string; value: number;
  onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div>
      <Label dangerouslySetInnerHTML={{ __html: label }} />
      <Input type="number" value={value} disabled={disabled}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="mono mt-1" />
      {helper && <p className="text-[11px] text-muted-foreground mt-1">{helper}</p>}
    </div>
  );
}

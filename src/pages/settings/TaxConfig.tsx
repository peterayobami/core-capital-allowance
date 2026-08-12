import { OrgSettingsShell } from "@/components/settings/OrgSettingsShell";
import { PageCard, SectionHeading } from "@/components/reports/ReportPrimitives";
import { useOrgSettings } from "@/stores/org-settings.store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TaxConfigPage() {
  const taxConfig = useOrgSettings(s => s.taxConfig);
  const updateTaxConfig = useOrgSettings(s => s.updateTaxConfig);
  const setUnrecoupedCABF = useOrgSettings(s => s.setUnrecoupedCABF);
  const fiscalYears = useOrgSettings(s => s.fiscalYears);

  const [newCat, setNewCat] = useState("");
  const [newRate, setNewRate] = useState(10);

  function removeWht(idx: number) {
    updateTaxConfig({ whtSchedule: taxConfig.whtSchedule.filter((_, i) => i !== idx) });
  }
  function addWht() {
    if (!newCat.trim()) { toast.error("Enter a category"); return; }
    updateTaxConfig({
      whtSchedule: [...taxConfig.whtSchedule, { category: newCat.trim(), rate: newRate }],
    });
    setNewCat(""); setNewRate(10);
  }

  return (
    <OrgSettingsShell title="Tax Configuration">
      <div className="space-y-6">
        <PageCard title="VAT">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>VAT Rate (%)</Label>
              <Input type="number" step="0.5" value={taxConfig.vatRate}
                onChange={e => updateTaxConfig({ vatRate: Number(e.target.value) || 0 })}
                className="mono" />
              <p className="text-[11px] text-muted-foreground mt-1">Standard Nigerian VAT is 7.5%.</p>
            </div>
          </div>
        </PageCard>

        <PageCard title="Withholding Tax Schedule">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground w-[120px]">Rate (%)</th>
                  <th className="w-12 py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {taxConfig.whtSchedule.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-3">{r.category}</td>
                    <td className="py-2 px-3 mono text-right">{r.rate}%</td>
                    <td className="py-2 px-3">
                      <button onClick={() => removeWht(i)}
                        className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-border bg-secondary/30">
                  <td className="py-2 px-3">
                    <Input value={newCat} onChange={e => setNewCat(e.target.value)}
                      placeholder="e.g. Royalties" className="h-9" />
                  </td>
                  <td className="py-2 px-3">
                    <Input type="number" value={newRate}
                      onChange={e => setNewRate(Number(e.target.value) || 0)}
                      className="mono text-right h-9" />
                  </td>
                  <td className="py-2 px-3">
                    <Button size="sm" className="h-9" onClick={addWht}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </PageCard>

        <PageCard title="Company Income Tax">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>CIT Size Classification</Label>
              <Select value={taxConfig.citClassification}
                onValueChange={(v) => updateTaxConfig({ citClassification: v as any })}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto">Auto (by gross income)</SelectItem>
                  <SelectItem value="Small">Small (₦25M and below) — 0%</SelectItem>
                  <SelectItem value="Medium">Medium (₦25M–₦100M) — 20%</SelectItem>
                  <SelectItem value="Large">Large (above ₦100M) — 30%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                "Auto" picks the band from total annual revenue.
              </p>
            </div>
          </div>
        </PageCard>

        <PageCard title="Capital Allowance — Unrecouped B/F">
          <p className="text-[12.5px] text-muted-foreground mb-3">
            Tax-only figure used in CIT computation. The Profit &amp; Loss reads these values
            automatically — no manual input on the report page.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fiscalYears.map(fy => (
              <div key={fy.year}>
                <Label>FY {fy.year} — Unrecouped CA B/F (₦)</Label>
                <Input type="number" value={taxConfig.unrecoupedCABF[fy.year] ?? 0}
                  onChange={e => setUnrecoupedCABF(fy.year, Number(e.target.value) || 0)}
                  className="mono mt-1"
                  disabled={fy.status === "closed"} />
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </OrgSettingsShell>
  );
}

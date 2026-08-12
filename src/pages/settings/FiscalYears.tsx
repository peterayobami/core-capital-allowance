import { OrgSettingsShell } from "@/components/settings/OrgSettingsShell";
import { PageCard } from "@/components/reports/ReportPrimitives";
import { useOrgSettings } from "@/stores/org-settings.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FiscalYearsPage() {
  const fiscalYears = useOrgSettings(s => s.fiscalYears);
  const upsertFiscalYear = useOrgSettings(s => s.upsertFiscalYear);
  const closeFiscalYear = useOrgSettings(s => s.closeFiscalYear);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear() + 1);

  function addYear() {
    if (fiscalYears.some(y => y.year === newYear)) {
      toast.error(`Fiscal year ${newYear} already exists.`);
      return;
    }
    upsertFiscalYear({
      year: newYear, status: "active",
      startDate: `${newYear}-01-01`, endDate: `${newYear}-12-31`,
    });
    toast.success(`Fiscal year ${newYear} added`);
  }

  return (
    <OrgSettingsShell title="Fiscal Years">
      <PageCard
        title="Configured Fiscal Years"
        action={
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-[11px]">New Year</Label>
              <Input type="number" value={newYear}
                onChange={e => setNewYear(Number(e.target.value) || 0)}
                className="mono w-28 h-9" />
            </div>
            <Button onClick={addYear} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1.5" /> Add Year
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Fiscal Year</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Period</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fiscalYears.map(fy => (
                <tr key={fy.year} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-2 px-3 mono font-semibold">FY {fy.year}</td>
                  <td className="py-2 px-3 mono text-muted-foreground">
                    {fy.startDate} → {fy.endDate}
                  </td>
                  <td className="py-2 px-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                      fy.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                    )}>
                      {fy.status === "closed" && <Lock className="h-3 w-3 mr-1" />}
                      {fy.status === "active" ? "Active" : "Closed"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    {fy.status === "active" && (
                      <Button variant="outline" size="sm" onClick={() => {
                        closeFiscalYear(fy.year);
                        toast.success(`FY ${fy.year} closed`);
                      }}>
                        <Lock className="h-3.5 w-3.5 mr-1" /> Close Year
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-4">
          Closing a fiscal year locks its opening balances and prevents back-dated journal posting.
        </p>
      </PageCard>
    </OrgSettingsShell>
  );
}

import { OrgSettingsShell } from "@/components/settings/OrgSettingsShell";
import { PageCard } from "@/components/reports/ReportPrimitives";
import { useOrgSettings } from "@/stores/org-settings.store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CompanyProfilePage() {
  const company = useOrgSettings(s => s.company);
  const updateCompany = useOrgSettings(s => s.updateCompany);
  const [draft, setDraft] = useState(company);

  function save() {
    updateCompany(draft);
    toast.success("Company profile updated");
    // 🔌 BACKEND: PUT /api/settings/company
  }

  return (
    <OrgSettingsShell title="Company Profile">
      <PageCard title="Company Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Company Name</Label>
            <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <Label>Registration Number</Label>
            <Input value={draft.registrationNumber}
              onChange={e => setDraft({ ...draft, registrationNumber: e.target.value })} />
          </div>
          <div>
            <Label>Industry</Label>
            <Input value={draft.industry}
              onChange={e => setDraft({ ...draft, industry: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Registered Address</Label>
            <Textarea value={draft.address} rows={2}
              onChange={e => setDraft({ ...draft, address: e.target.value })} />
          </div>
          <div>
            <Label>Fiscal Year Start Month</Label>
            <Select
              value={String(draft.fiscalYearStartMonth)}
              onValueChange={v => setDraft({ ...draft, fiscalYearStartMonth: Number(v) })}
            >
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Logo URL (optional)</Label>
            <Input value={draft.logoUrl ?? ""}
              onChange={e => setDraft({ ...draft, logoUrl: e.target.value || undefined })}
              placeholder="https://…" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDraft(company)}>Reset</Button>
          <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save Changes
          </Button>
        </div>
      </PageCard>
    </OrgSettingsShell>
  );
}

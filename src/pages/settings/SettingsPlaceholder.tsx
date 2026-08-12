import { OrgSettingsShell } from "@/components/settings/OrgSettingsShell";
import { Construction } from "lucide-react";

export default function SettingsPlaceholder({ title }: { title: string }) {
  return (
    <OrgSettingsShell title={title}>
      <div className="cl-card p-12 flex flex-col items-center justify-center text-center min-h-[40vh] border border-border">
        <div className="h-12 w-12 rounded-full bg-muted text-muted-foreground grid place-items-center mb-4">
          <Construction className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold">{title} — coming soon</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          This configuration section is on the roadmap and will be available in a later phase.
        </p>
      </div>
    </OrgSettingsShell>
  );
}

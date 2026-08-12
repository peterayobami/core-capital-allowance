import { AppShell } from "@/components/layout/AppShell";
import { Construction } from "lucide-react";

export default function UserSettings() {
  return (
    <AppShell title="Settings">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </div>
          <h1 className="text-xl font-semibold mt-1">User &amp; System Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            User profile, password, notifications, appearance, and system administration.
          </p>
        </div>
        <div className="cl-card p-12 flex flex-col items-center justify-center text-center min-h-[40vh] border border-border">
          <div className="h-12 w-12 rounded-full bg-muted text-muted-foreground grid place-items-center mb-4">
            <Construction className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold">Settings — coming soon</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Looking for company-level settings? Click your organisation name at the top of
            the sidebar to enter <strong>Organisation Settings</strong>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

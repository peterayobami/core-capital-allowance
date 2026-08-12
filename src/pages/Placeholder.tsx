import { AppShell } from "@/components/layout/AppShell";
import { Construction } from "lucide-react";

export default function Placeholder({ title, breadcrumbs: _breadcrumbs }: { title: string; breadcrumbs?: string[] }) {
  return (
    <AppShell title={title}>
      <div className="px-7 py-6">
        <h1 className="text-xl font-semibold mb-5">{title}</h1>
        <div className="cl-card p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
          <div className="h-12 w-12 rounded-full bg-muted text-muted-foreground grid place-items-center mb-4">
            <Construction className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold">{title} — coming soon</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            This module is on the roadmap and will be available soon.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

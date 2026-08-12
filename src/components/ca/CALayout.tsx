import { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CATabs } from "./CATabs";

export function CALayout({
  breadcrumbs, children, hideTabs,
}: { breadcrumbs: string[]; children: ReactNode; hideTabs?: boolean }) {
  const title = breadcrumbs[breadcrumbs.length - 1];
  return (
    <AppShell title={title}>
      {!hideTabs && <CATabs />}
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {children}
      </div>
    </AppShell>
  );
}

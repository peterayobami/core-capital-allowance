import { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PAYETabs } from "./PAYETabs";

export function PAYELayout({
  breadcrumbs, children, hideTabs,
}: { breadcrumbs: string[]; children: ReactNode; hideTabs?: boolean }) {
  const title = breadcrumbs[breadcrumbs.length - 1];
  return (
    <AppShell title={title}>
      {!hideTabs && <PAYETabs />}
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {children}
      </div>
    </AppShell>
  );
}

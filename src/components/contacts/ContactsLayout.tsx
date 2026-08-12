import { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export function ContactsLayout({
  title, children, headerRight: _headerRight,
}: { title: string; children: ReactNode; headerRight?: ReactNode }) {
  return (
    <AppShell title={title}>
      <div className="px-7 py-6">
        {children}
      </div>
    </AppShell>
  );
}

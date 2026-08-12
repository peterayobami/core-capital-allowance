import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", to: "/taxation/capital-allowance" },
  { label: "Schedule", to: "/taxation/capital-allowance/schedule" },
  { label: "Classifications", to: "/taxation/capital-allowance/classifications" },
  { label: "History", to: "/taxation/capital-allowance/history" },
];

export function CATabs() {
  const { pathname } = useLocation();
  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 flex items-center gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const active = pathname === t.to;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {active && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-t-full" />}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

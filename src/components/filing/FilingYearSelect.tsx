import { useOrgSettings } from "@/stores/org-settings.store";
import { availableYears } from "@/lib/services/tax.service";

/**
 * Fiscal-year selector for the Filing & Documentation module.
 * Sources years from Organisation Settings (with Active/Closed status);
 * falls back to years present in the ledger data.
 */
export function FilingYearSelect({
  value, onChange,
}: { value: number; onChange: (y: number) => void }) {
  const fiscalYears = useOrgSettings((s) => s.fiscalYears);
  const years = fiscalYears.length
    ? [...fiscalYears].sort((a, b) => b.year - a.year)
    : availableYears().map((y) => ({ year: y, status: "active" as const }));

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
    >
      {years.map((fy) => (
        <option key={fy.year} value={fy.year}>
          FY {fy.year} — {fy.status === "closed" ? "Closed" : "Active"}
        </option>
      ))}
    </select>
  );
}

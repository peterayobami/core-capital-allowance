import { availableYears, type Period } from "@/lib/services/tax.service";

export function YearSelect({
  value, onChange,
}: { value: number; onChange: (y: number) => void }) {
  const years = availableYears();
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
    >
      {years.map(y => <option key={y} value={y}>FY {y}</option>)}
    </select>
  );
}

export function PeriodSelect({
  value, onChange,
}: { value: Period; onChange: (p: Period) => void }) {
  const isMonth = typeof value === "number";
  return (
    <div className="flex items-center gap-2">
      <select
        value={isMonth ? "month" : (value as string)}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "month") onChange(1);
          else onChange(v as Period);
        }}
        className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        <option value="full">Full Year</option>
        <option value="Q1">Q1 (Jan–Mar)</option>
        <option value="Q2">Q2 (Apr–Jun)</option>
        <option value="Q3">Q3 (Jul–Sep)</option>
        <option value="Q4">Q4 (Oct–Dec)</option>
        <option value="month">Monthly</option>
      </select>
      {isMonth && (
        <select
          value={value as number}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export function periodLabel(year: number, period: Period): string {
  if (period === "full") return `Full Year ${year}`;
  if (typeof period === "number") {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[period - 1]} ${year}`;
  }
  return `${period} ${year}`;
}

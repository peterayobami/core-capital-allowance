import { PAYELayout } from "@/components/paye/PAYELayout";
import { BandChip } from "@/components/paye/RunStatusBadge";
import { PAYE_BANDS } from "@/lib/mock-data/paye";
import { formatNGN } from "@/lib/services/paye.service";
import { Info } from "lucide-react";

export default function TaxBands() {
  return (
    <PAYELayout breadcrumbs={["Taxation", "PAYE", "Tax Bands"]}>
      <div>
        <h1 className="text-xl font-semibold">PAYE Tax Bands</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nigeria Tax Act 2025 — progressive bands applied to annual chargeable income.
        </p>
      </div>

      <div className="data-card p-5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80 space-y-1">
            <p>
              Chargeable income is computed as <span className="font-mono">Gross − (Pension + NHF + NHIS + Rent Relief + Life Insurance)</span>.
            </p>
            <p>
              Annual chargeable income at or below <span className="font-mono font-semibold">₦800,000</span> is fully exempt.
              Above that, each band applies only to the portion of income falling within its range.
            </p>
          </div>
        </div>
      </div>

      <div className="data-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Progressive Bands</h3>
          <p className="text-xs text-muted-foreground">Marginal rates on annual chargeable income</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-center px-4 py-2.5 w-20">Band</th>
                <th className="text-left px-4 py-2.5">Range (annual)</th>
                <th className="text-right px-4 py-2.5">Band size</th>
                <th className="text-right px-4 py-2.5">Max tax in band</th>
                <th className="text-right px-4 py-2.5">Cumulative max</th>
              </tr>
            </thead>
            <tbody>
              {PAYE_BANDS.map((b, i) => {
                const bandSize = b.to === null ? null : b.to - b.from;
                const maxTax = bandSize ? bandSize * (b.rate / 100) : null;
                return (
                  <tr key={i}>
                    <td className="px-4 py-3 text-center"><BandChip rate={b.rate} /></td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {b.from === 0 ? "₦0" : formatNGN(b.from)} —{" "}
                      {b.to === null ? <span className="text-muted-foreground">and above</span> : formatNGN(b.to)}
                    </td>
                    <td className="fig px-4 py-3">
                      {bandSize ? formatNGN(bandSize) : <span className="text-muted-foreground">∞</span>}
                    </td>
                    <td className="fig px-4 py-3">
                      {maxTax !== null ? formatNGN(maxTax) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="fig px-4 py-3 font-semibold">
                      {b.cumMax !== null ? formatNGN(b.cumMax) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worked example */}
      <div className="data-card p-5">
        <h3 className="text-sm font-semibold mb-1">Worked example</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Employee with chargeable annual income of ₦5,000,000.
        </p>
        <div className="space-y-1.5">
          {(() => {
            let remaining = 5_000_000;
            let total = 0;
            return PAYE_BANDS.map((b, i) => {
              if (remaining <= 0) {
                return (
                  <div key={i} className="flex items-center gap-3 text-xs opacity-40">
                    <BandChip rate={b.rate} />
                    <span className="text-muted-foreground flex-1">No income in this band</span>
                    <span className="font-mono w-32 text-right">—</span>
                  </div>
                );
              }
              const bandSize = b.to === null ? remaining : b.to - b.from;
              const inBand = Math.min(remaining, bandSize);
              const tax = inBand * (b.rate / 100);
              remaining -= inBand;
              total += tax;
              return (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <BandChip rate={b.rate} />
                  <span className="text-foreground/80 flex-1 font-mono">
                    {formatNGN(inBand)} × {b.rate}%
                  </span>
                  <span className="font-mono font-medium w-32 text-right">{formatNGN(tax)}</span>
                </div>
              );
            }).concat([
              <div key="total" className="flex items-center gap-3 text-sm pt-3 mt-2 border-t border-border">
                <span className="flex-1 font-semibold">Annual PAYE</span>
                <span className="font-mono font-semibold w-32 text-right">{formatNGN(total)}</span>
              </div>,
              <div key="monthly" className="flex items-center gap-3 text-xs">
                <span className="flex-1 text-muted-foreground">Monthly PAYE (÷ 12)</span>
                <span className="font-mono w-32 text-right text-muted-foreground">{formatNGN(total / 12)}</span>
              </div>,
            ]);
          })()}
        </div>
      </div>
    </PAYELayout>
  );
}

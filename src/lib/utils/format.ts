/** Format any number as Nigerian Naira (₦) with thousands separators. */
export function formatNGN(n: number, opts: { decimals?: number } = {}): string {
  const decimals = opts.decimals ?? 0;
  const v = Math.abs(n);
  const formatted = v.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return n < 0 ? `(₦${formatted})` : `₦${formatted}`;
}

export function formatNGN2(n: number): string {
  return formatNGN(n, { decimals: 2 });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

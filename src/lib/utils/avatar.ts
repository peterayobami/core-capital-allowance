// Avatar palette cycled by name hash (Core Ledger spec, sec 6)
const PALETTE = [
  { bg: "#EBF2FF", fg: "#184F97" },
  { bg: "#E8F8EE", fg: "#00A067" },
  { bg: "#FFF3E0", fg: "#F47727" },
  { bg: "#F3E5F5", fg: "#7B1FA2" },
  { bg: "#E3F2FD", fg: "#237EB5" },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarColors(name: string) {
  return PALETTE[hash(name) % PALETTE.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Filing & Documentation domain models.
//
// Two concepts that must never be blurred (per requirements brief §2):
//   A) The Audited Financial Statement (AFS) — a statutory accounting artifact
//      shaped by accounting standards (ICAN conventions), NOT by NRS/Rev360.
//   B) The Rev360 Filing Pack — a tax-season checklist tied to what the Rev360
//      portal currently asks a taxpayer to upload for CIT annual filing.

export type AFSComponentId =
  | "sofp"        // Statement of Financial Position
  | "soci"        // Statement of Comprehensive Income
  | "socie"       // Statement of Changes in Equity
  | "cashflow"    // Cash Flow Statement
  | "notes"       // Notes to the Accounts
  | "valueadded"  // Statement of Value Added
  | "finsummary"; // Financial Summary

export interface AFSComponent {
  id: AFSComponentId;
  no: number;
  title: string;
  /** True for the three statements computed for the first time in this module. */
  isNewComputation: boolean;
}

// ── Generic comparative statement row (current year + prior year) ────────────
export interface ComparativeRow {
  label: string;
  value: number;
  prior: number | null;
  indent?: number;
  bold?: boolean;
  total?: boolean;
  negative?: boolean;
  noteNo?: number;
}

// ── Statement of Changes in Equity ───────────────────────────────────────────
export interface ChangesInEquityRow {
  label: string;
  shareCapital: number | null;
  retainedEarnings: number | null;
  /** The money amount in the "Total" column. */
  total: number;
  bold?: boolean;
  /** Visual flag: this row is a statement total (heavier rule above it). */
  isTotal?: boolean;
}

export interface ChangesInEquityStatement {
  year: number;
  rows: ChangesInEquityRow[];
  priorRows: ChangesInEquityRow[];
  hasPrior: boolean;
}

// ── Statement of Value Added ─────────────────────────────────────────────────
export interface ValueAddedLine {
  label: string;
  value: number;
  prior: number | null;
  pct?: number;
  priorPct?: number;
  indent?: number;
  bold?: boolean;
  total?: boolean;
  /** True when the line carries a Notes-to-the-Accounts cross-reference. */
  noteRef?: boolean;
}

export interface ValueAddedStatement {
  year: number;
  hasPrior: boolean;
  applied: ValueAddedLine[];      // sources side (turnover, bought-in, value added)
  distributed: ValueAddedLine[];  // distribution side (employees, government, …)
}

// ── Financial Summary (multi-year) ───────────────────────────────────────────
export interface FinancialSummary {
  years: number[];
  bands: string[];
  rows: { label: string; values: number[]; bold?: boolean }[];
}

// ── Notes to the Accounts ────────────────────────────────────────────────────
export interface AfsNote {
  no: number;
  title: string;
  narrative?: string;
  rows: ComparativeRow[];
}

// ── Rev360 Filing Pack ───────────────────────────────────────────────────────
export type FilingItemStatus = "ready" | "not_applicable" | "external";

export interface FilingPackItem {
  id: string;
  title: string;
  description: string;
  status: FilingItemStatus;
  statusNote?: string;
  /** In-app route where the document can be viewed/exported (when ready). */
  route?: string;
  actionLabel?: string;
}

export interface FilingPack {
  year: number;
  classification: "Small" | "Medium" | "Large";
  items: FilingPackItem[];
  readyCount: number;
}

// ── Generation history / personal archive ────────────────────────────────────
export interface GeneratedRecord {
  year: number;
  generatedAt: string; // ISO
  /** Fingerprint of the underlying figures at generation time. */
  fingerprint: number;
  version: number;
}

export interface ArchiveEntry {
  id: string;
  year: number;
  title: string;
  note?: string;
  addedAt: string; // ISO
}

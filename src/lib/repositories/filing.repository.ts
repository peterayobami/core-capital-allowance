// Filing & Documentation repository — the seam between the UI and the backend.
// 🔌 BACKEND: swap these bodies for API calls:
//   GET  /api/filing/afs?year=
//   GET  /api/filing/rev360-pack?year=
//   GET/POST /api/filing/history, GET/POST/DELETE /api/filing/archive

import {
  AFS_COMPONENTS, buildFilingPack, dataFingerprint,
} from "@/lib/services/afs.service";
import {
  getGeneratedRecord, useFilingHistoryStore,
} from "@/stores/filing-history.store";
import type { AFSComponent, FilingPack, GeneratedRecord, ArchiveEntry } from "@/lib/models/filing";

export const filingRepository = {
  listAfsComponents: (): AFSComponent[] => AFS_COMPONENTS,

  getFilingPack: (
    year: number,
    citSetting: "Small" | "Medium" | "Large" | "Auto",
  ): FilingPack => buildFilingPack(year, citSetting),

  getGeneratedRecord: (year: number): GeneratedRecord | undefined =>
    getGeneratedRecord(year),

  recordGeneration: (year: number): GeneratedRecord => {
    useFilingHistoryStore.getState().recordGeneration(year, dataFingerprint(year));
    return getGeneratedRecord(year)!;
  },

  /** True when underlying figures changed since the pack was generated. */
  isStale: (year: number): boolean => {
    const rec = getGeneratedRecord(year);
    if (!rec) return false;
    return rec.fingerprint !== dataFingerprint(year);
  },

  listArchive: (): ArchiveEntry[] => useFilingHistoryStore.getState().archive,

  addArchiveEntry: (year: number, title: string, note?: string): void =>
    useFilingHistoryStore.getState().addArchiveEntry(year, title, note),

  removeArchiveEntry: (id: string): void =>
    useFilingHistoryStore.getState().removeArchiveEntry(id),
};

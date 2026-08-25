// 🔌 BACKEND: GET/POST /api/filing/history and /api/filing/archive.
// This zustand store is a frontend-only cache of (a) which fiscal years have a
// generated AFS on record and (b) the subscriber's OPTIONAL personal archive of
// signed-document references. The archive is personal recordkeeping only —
// nothing in the filing flow depends on it (requirements brief §3.4).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedRecord, ArchiveEntry } from "@/lib/models/filing";

interface FilingHistoryState {
  /** AFS generation history keyed by fiscal year. */
  generated: Record<number, GeneratedRecord>;
  /** Optional personal archive of signed copies (metadata only). */
  archive: ArchiveEntry[];

  recordGeneration: (year: number, fingerprint: number) => void;
  addArchiveEntry: (year: number, title: string, note?: string) => void;
  removeArchiveEntry: (id: string) => void;
}

export const useFilingHistoryStore = create<FilingHistoryState>()(
  persist(
    (set, get) => ({
      generated: {},
      archive: [],

      recordGeneration: (year, fingerprint) =>
        set((s) => ({
          generated: {
            ...s.generated,
            [year]: {
              year,
              generatedAt: new Date().toISOString(),
              fingerprint,
              version: (s.generated[year]?.version ?? 0) + 1,
            },
          },
        })),

      addArchiveEntry: (year, title, note) =>
        set((s) => ({
          archive: [
            {
              id: `arc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              year,
              title,
              note,
              addedAt: new Date().toISOString(),
            },
            ...s.archive,
          ],
        })),

      removeArchiveEntry: (id) =>
        set((s) => ({ archive: s.archive.filter((e) => e.id !== id) })),
    }),
    { name: "coreledger-filing-history" },
  ),
);

/** Non-reactive reader for services/repositories. */
export function getGeneratedRecord(year: number): GeneratedRecord | undefined {
  return useFilingHistoryStore.getState().generated[year];
}

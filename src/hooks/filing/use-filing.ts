import { useQuery } from "@tanstack/react-query";
import { filingRepository } from "@/lib/repositories/filing.repository";
import { useFilingHistoryStore } from "@/stores/filing-history.store";
import { useOrgSettings } from "@/stores/org-settings.store";

export const filingKeys = {
  components: ["filing", "afs-components"] as const,
  pack: (year: number) => ["filing", "rev360-pack", year] as const,
};

export const useAfsComponents = () =>
  useQuery({ queryKey: filingKeys.components, queryFn: filingRepository.listAfsComponents });

/** Rev360 filing checklist for a fiscal year, scoped to the org's CIT setting. */
export function useFilingPack(year: number) {
  const citSetting = useOrgSettings((s) => s.taxConfig.citClassification);
  return useQuery({
    queryKey: [...filingKeys.pack(year), citSetting],
    queryFn: () => Promise.resolve(filingRepository.getFilingPack(year, citSetting)),
  });
}

/** Reactive view of generation history + personal archive. */
export function useFilingHistory() {
  const generated = useFilingHistoryStore((s) => s.generated);
  const archive = useFilingHistoryStore((s) => s.archive);
  return { generated, archive };
}

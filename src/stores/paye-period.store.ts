import { create } from "zustand";
import { payeRepository } from "@/lib/repositories/paye.repository";
import type { Period } from "@/lib/models/paye";

type PayePeriodStore = {
    period: Period;
    setPeriod: (p: Period) => void;
};

export const usePayePeriodStore = create<PayePeriodStore>((set) => ({
    period: payeRepository.getCurrentPeriod(),
    setPeriod: (period) => set({ period }),
}));

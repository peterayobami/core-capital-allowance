import { create } from "zustand";
import { caRepository } from "@/lib/repositories/ca.repository";

type FiscalYearStore = {
    fiscalYear: number;
    setFiscalYear: (fy: number) => void;
};

export const useFiscalYearStore = create<FiscalYearStore>((set) => ({
    fiscalYear: caRepository.getCurrentFiscalYear(),
    setFiscalYear: (fy) => set({ fiscalYear: fy }),
}));

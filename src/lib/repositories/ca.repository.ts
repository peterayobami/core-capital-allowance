import { YEARS, CURRENT_FY } from "@/lib/mock-data/ca";
import type { CAYear } from "@/lib/models/ca";

export const caRepository = {
    getAll: (): CAYear[] => YEARS,
    getByFiscalYear: (fy: number): CAYear | undefined => YEARS.find(y => y.fiscalYear === fy),
    getCurrentFiscalYear: (): number => CURRENT_FY,
};

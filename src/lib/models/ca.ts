export type CAStatus = "not_computed" | "computed" | "locked";

export type Classification = {
    id: number; name: string; shortName: string;
    aaRate: number; usefulLife: number | null; depreciationRate: number;
    description: string;
    group: "building" | "furniture" | "machinery" | "vehicle" | "tech" | "infra" | "other";
};

export type ScheduleRow = {
    classificationId: number; twdvBf: number; additions: number;
    poolCost: number; annualAllowance: number; retentionFloor: number; twdvCf: number;
};

export type CAYear = {
    fiscalYear: number; assessmentYear: number; status: CAStatus;
    lockedAt?: string; lockedBy?: string;
    rows: ScheduleRow[]; unrecoupedBf: number;
    grossIncome: number; costOfSales: number; expenses: number; depreciationAddback: number;
    citRate?: number; caRelieved?: number; citPayable?: number;
};

export type TaxComputation = {
    adjustedProfit: number; totalCAAvailable: number; caRelieved: number;
    unrecoupedCf: number; assessableIncome: number;
    band: "Small" | "Medium" | "Large"; citRate: number; citPayable: number;
    effectiveTaxRate: number;
};

export type PayeRunStatus = "no_run" | "computed" | "approved" | "locked";
export type RemittanceStatus = "pending" | "submitted" | "overdue" | "not_due";

export type PayeBand = { rate: number; from: number; to: number | null; label: string; cumMax: number | null };

export type PayeProfile = {
    basic: number; housing: number; transport: number; other: number;
    rentPaid: number; rentReliefApproved: boolean; lifeInsurance: number;
    nhisOptIn: boolean; nhisAmount: number;
    residency: "Resident" | "Non-Resident"; state: string; tin: string | null; hasProfile: boolean;
};

export type Employee = {
    id: string; name: string; department: string; email: string; profile: PayeProfile;
};

export type PayeComputation = {
    grossAnnual: number; pensionableAnnual: number; pension: number; nhf: number;
    nhis: number; rentRelief: number; lifeInsurance: number; totalDeductions: number;
    chargeableAnnual: number; bandSplits: { rate: number; income: number; tax: number }[];
    annualPaye: number; monthlyPaye: number; monthlyGross: number; monthlyPension: number;
    monthlyNhf: number; monthlyRentRelief: number; monthlyNet: number;
    etr: number; highestBand: number; isExempt: boolean;
};

export type Period = { year: number; month: number };

export type RunEntry = {
    employeeId: string; monthlyGross: number; monthlyPension: number; monthlyNhf: number;
    monthlyRentRelief: number; monthlyChargeable: number; highestBand: number;
    monthlyPaye: number; monthlyNet: number; isExempt: boolean; priorMonthlyPaye?: number;
};

export type Remittance = {
    period: Period; amount: number; dueDate: string; submittedDate?: string;
    paymentRef?: string; penalty: number; status: RemittanceStatus;
};

export type PayrollRun = {
    period: Period; status: PayeRunStatus; computedAt?: string;
    approvedAt?: string; lockedAt?: string; lockedBy?: string;
    entries: RunEntry[];
    totals: {
        gross: number; pension: number; nhf: number; paye: number; net: number;
        headcount: number; avgEtr: number; exemptCount: number
    };
    remittance?: Remittance;
};

export type ValidationIssue = {
    employeeId: string; employeeName: string; severity: "error" | "warning"; message: string;
};

import type { PayeBand, PayeProfile, Employee, Period, PayrollRun, Remittance, RunEntry } from "@/lib/models/paye";
import { computePaye } from "@/lib/services/paye.service";

export const PAYE_BANDS: PayeBand[] = [
    { rate: 0, from: 0, to: 800_000, label: "0%", cumMax: 0 },
    { rate: 15, from: 800_000, to: 3_000_000, label: "15%", cumMax: 330_000 },
    { rate: 18, from: 3_000_000, to: 10_000_000, label: "18%", cumMax: 1_260_000 },
    { rate: 21, from: 10_000_000, to: 25_000_000, label: "21%", cumMax: 3_150_000 },
    { rate: 23, from: 25_000_000, to: 50_000_000, label: "23%", cumMax: 5_750_000 },
    { rate: 25, from: 50_000_000, to: null, label: "25%", cumMax: null },
];

export function bandColor(rate: number): string {
    switch (rate) {
        case 0: return "hsl(var(--chart-slate))";
        case 15: return "hsl(239 84% 80%)";
        case 18: return "hsl(239 84% 65%)";
        case 21: return "hsl(239 84% 50%)";
        case 23: return "hsl(262 83% 58%)";
        case 25: return "hsl(0 72% 51%)";
        default: return "hsl(var(--muted-foreground))";
    }
}

export function bandChipClasses(rate: number): string {
    switch (rate) {
        case 0: return "bg-secondary text-foreground/70 border-border";
        case 15: return "bg-accent-soft text-accent border-accent/30";
        case 18: return "bg-accent/20 text-accent border-accent/40";
        case 21: return "bg-accent text-accent-foreground border-accent";
        case 23: return "bg-[hsl(262_83%_58%)] text-white border-[hsl(262_83%_58%)]";
        case 25: return "bg-danger text-danger-foreground border-danger";
        default: return "bg-secondary text-muted-foreground border-border";
    }
}

const blank = (): PayeProfile => ({
    basic: 0, housing: 0, transport: 0, other: 0,
    rentPaid: 0, rentReliefApproved: false, lifeInsurance: 0,
    nhisOptIn: false, nhisAmount: 0,
    residency: "Resident", state: "Lagos", tin: null, hasProfile: false,
});

const mk = (
    basic: number, housing: number, transport: number, other: number,
    rent: number, rentApproved: boolean, lifeIns = 0, tin: string | null = null,
    state = "Lagos",
): PayeProfile => ({
    basic, housing, transport, other,
    rentPaid: rent, rentReliefApproved: rentApproved, lifeInsurance: lifeIns,
    nhisOptIn: false, nhisAmount: 0,
    residency: "Resident", state, tin, hasProfile: true,
});

export const EMPLOYEES: Employee[] = [
    { id: "E001", name: "Adaeze Okonkwo", department: "Finance", email: "adaeze@bechellente.com", profile: mk(4_800_000, 2_400_000, 1_200_000, 600_000, 1_800_000, true, 120_000, "1234567890", "Lagos") },
    { id: "E002", name: "Tunde Bakare", department: "Engineering", email: "tunde@bechellente.com", profile: mk(7_200_000, 3_600_000, 1_800_000, 1_200_000, 2_400_000, true, 200_000, "2345678901", "Lagos") },
    { id: "E003", name: "Ngozi Eze", department: "Sales", email: "ngozi@bechellente.com", profile: mk(3_600_000, 1_800_000, 900_000, 400_000, 1_200_000, true, 0, "3456789012", "Abuja") },
    { id: "E004", name: "Femi Adeyemi", department: "Operations", email: "femi@bechellente.com", profile: mk(2_400_000, 1_200_000, 600_000, 200_000, 0, false, 0, "4567890123", "Oyo") },
    { id: "E005", name: "Chiamaka Obi", department: "HR", email: "chiamaka@bechellente.com", profile: mk(3_000_000, 1_500_000, 750_000, 250_000, 900_000, false, 0, "5678901234", "Lagos") },
    { id: "E006", name: "Yusuf Ibrahim", department: "Engineering", email: "yusuf@bechellente.com", profile: mk(9_600_000, 4_800_000, 2_400_000, 2_000_000, 3_600_000, true, 250_000, "6789012345", "Lagos") },
    { id: "E007", name: "Bisola Adekunle", department: "Marketing", email: "bisola@bechellente.com", profile: mk(4_200_000, 2_100_000, 1_050_000, 500_000, 1_500_000, true, 80_000, "7890123456", "Lagos") },
    { id: "E008", name: "Emeka Nwosu", department: "Engineering", email: "emeka@bechellente.com", profile: mk(5_400_000, 2_700_000, 1_350_000, 800_000, 2_000_000, true, 150_000, "8901234567", "Rivers") },
    { id: "E009", name: "Halima Mohammed", department: "Finance", email: "halima@bechellente.com", profile: mk(3_300_000, 1_650_000, 825_000, 300_000, 0, false, 0, "9012345678", "Kano") },
    { id: "E010", name: "Olumide Salami", department: "Executive", email: "olumide@bechellente.com", profile: mk(18_000_000, 9_000_000, 4_500_000, 6_000_000, 5_000_000, true, 500_000, "0123456789", "Lagos") },
    { id: "E011", name: "Kemi Williams", department: "Sales", email: "kemi@bechellente.com", profile: mk(2_700_000, 1_350_000, 675_000, 200_000, 800_000, true, 0, "1122334455", "Lagos") },
    { id: "E012", name: "Ibrahim Garba", department: "Operations", email: "ibrahim@bechellente.com", profile: mk(2_100_000, 1_050_000, 525_000, 150_000, 600_000, false, 0, null, "Kaduna") },
    { id: "E013", name: "Grace Okafor", department: "Marketing", email: "grace@bechellente.com", profile: mk(3_900_000, 1_950_000, 975_000, 400_000, 1_200_000, true, 60_000, "2233445566", "Lagos") },
    { id: "E014", name: "Sanjay Patel", department: "Engineering", email: "sanjay@bechellente.com", profile: mk(8_400_000, 4_200_000, 2_100_000, 1_500_000, 3_000_000, true, 180_000, "3344556677", "Lagos") },
    { id: "E015", name: "Folake Adesina", department: "HR", email: "folake@bechellente.com", profile: mk(2_700_000, 1_350_000, 675_000, 200_000, 0, false, 0, "4455667788", "Lagos") },
    { id: "E016", name: "Daniel Eze", department: "Finance", email: "daniel@bechellente.com", profile: mk(4_500_000, 2_250_000, 1_125_000, 600_000, 1_800_000, true, 100_000, "5566778899", "Lagos") },
    { id: "E017", name: "Aisha Lawal", department: "Sales", email: "aisha@bechellente.com", profile: mk(3_300_000, 1_650_000, 825_000, 350_000, 1_000_000, true, 0, "6677889900", "Abuja") },
    { id: "E018", name: "Chinedu Okolie", department: "Engineering", email: "chinedu@bechellente.com", profile: mk(6_000_000, 3_000_000, 1_500_000, 1_000_000, 2_400_000, true, 150_000, "7788990011", "Lagos") },
    { id: "E019", name: "Maryam Bello", department: "Operations", email: "maryam@bechellente.com", profile: blank() },
    { id: "E020", name: "Joseph Effiong", department: "Marketing", email: "joseph@bechellente.com", profile: mk(3_600_000, 1_800_000, 900_000, 400_000, 1_500_000, false, 0, "8899001122", "Akwa Ibom") },
];

// Period helpers
export const CURRENT_PERIOD: Period = { year: 2026, month: 3 };
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const periodKey = (p: Period) => `${p.year}-${String(p.month).padStart(2, "0")}`;
export const periodLong = (p: Period) => `${MONTH_LONG[p.month - 1]} ${p.year}`;
export const periodShort = (p: Period) => `${MONTH_NAMES[p.month - 1]} ${p.year}`;

export function prevPeriod(p: Period): Period {
    if (p.month === 1) return { year: p.year - 1, month: 12 };
    return { year: p.year, month: p.month - 1 };
}
export function addMonths(p: Period, n: number): Period {
    const idx = p.year * 12 + (p.month - 1) + n;
    return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

function buildRunEntries(period: Period, factor: number): RunEntry[] {
    return EMPLOYEES.filter(e => e.profile.hasProfile).map((e, i) => {
        const adj: PayeProfile = {
            ...e.profile,
            basic: Math.round(e.profile.basic * factor),
            housing: Math.round(e.profile.housing * factor),
            transport: Math.round(e.profile.transport * factor),
            other: Math.round(e.profile.other * factor * (1 + ((i % 3) * 0.02))),
        };
        const c = computePaye(adj);
        return {
            employeeId: e.id,
            monthlyGross: c.monthlyGross,
            monthlyPension: c.monthlyPension,
            monthlyNhf: c.monthlyNhf,
            monthlyRentRelief: c.monthlyRentRelief,
            monthlyChargeable: Math.round(c.chargeableAnnual / 12),
            highestBand: c.highestBand,
            monthlyPaye: c.monthlyPaye,
            monthlyNet: c.monthlyNet,
            isExempt: c.isExempt,
        };
    });
}

function buildRun(period: Period, status: import("@/lib/models/paye").PayeRunStatus, factor: number): PayrollRun {
    const entries = buildRunEntries(period, factor);
    const gross = entries.reduce((s, e) => s + e.monthlyGross, 0);
    const pension = entries.reduce((s, e) => s + e.monthlyPension, 0);
    const nhf = entries.reduce((s, e) => s + e.monthlyNhf, 0);
    const paye = entries.reduce((s, e) => s + e.monthlyPaye, 0);
    const net = entries.reduce((s, e) => s + e.monthlyNet, 0);
    const exemptCount = entries.filter(e => e.isExempt).length;
    const avgEtr = gross > 0 ? (paye / gross) * 100 : 0;
    return {
        period, status, entries,
        computedAt: status !== "no_run" ? `${period.year}-${String(period.month).padStart(2, "0")}-26` : undefined,
        approvedAt: status === "approved" || status === "locked" ? `${period.year}-${String(period.month).padStart(2, "0")}-27` : undefined,
        lockedAt: status === "locked" ? `${period.year}-${String(period.month).padStart(2, "0")}-28` : undefined,
        lockedBy: status === "locked" ? "Olamide Ade" : undefined,
        totals: { gross, pension, nhf, paye, net, headcount: entries.length, avgEtr, exemptCount },
    };
}

function dueDateForPeriod(p: Period): string {
    const next = addMonths(p, 1);
    return `${next.year}-${String(next.month).padStart(2, "0")}-10`;
}

function buildRunHistory(): PayrollRun[] {
    const runs: PayrollRun[] = [];
    for (let i = 11; i >= 0; i--) {
        const p = addMonths(CURRENT_PERIOD, -i);
        const factor = 0.92 + (11 - i) * 0.008;
        const status: import("@/lib/models/paye").PayeRunStatus = i === 0 ? "computed" : "locked";
        const run = buildRun(p, status, factor);
        if (status === "locked") {
            run.remittance = {
                period: p,
                amount: run.totals.paye,
                dueDate: dueDateForPeriod(p),
                submittedDate: `${addMonths(p, 1).year}-${String(addMonths(p, 1).month).padStart(2, "0")}-08`,
                paymentRef: `FIRS-${p.year}${String(p.month).padStart(2, "0")}-PAYE`,
                penalty: 0,
                status: "submitted",
            };
        }
        if (runs.length > 0) {
            const prior = runs[runs.length - 1];
            run.entries.forEach(e => {
                const pe = prior.entries.find(x => x.employeeId === e.employeeId);
                if (pe) e.priorMonthlyPaye = pe.monthlyPaye;
            });
        }
        runs.push(run);
    }
    return runs;
}

export const RUNS: PayrollRun[] = buildRunHistory();

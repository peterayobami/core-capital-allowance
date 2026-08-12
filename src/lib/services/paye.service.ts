import type { PayeProfile, PayeComputation, PayrollRun, ValidationIssue, Employee } from "@/lib/models/paye";
import { PAYE_BANDS, bandColor as _bandColor, bandChipClasses as _bandChipClasses } from "@/lib/mock-data/paye";

export function formatNGN(n: number): string {
    const v = Math.abs(n);
    const formatted = v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n < 0 ? `(Γéª${formatted})` : `Γéª${formatted}`;
}

export function formatNGNCompact(n: number): string {
    const v = Math.abs(n);
    if (v >= 1_000_000) return `${n < 0 ? "-" : ""}Γéª${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${n < 0 ? "-" : ""}Γéª${(v / 1_000).toFixed(0)}K`;
    return `${n < 0 ? "-" : ""}Γéª${v.toFixed(0)}`;
}

export function formatPct(n: number): string { return `${n.toFixed(1)}%`; }

export function computePaye(p: PayeProfile): PayeComputation {
    const grossAnnual = p.basic + p.housing + p.transport + p.other;
    const pensionableAnnual = p.basic + p.housing + p.transport;
    const pension = Math.round(pensionableAnnual * 0.08);
    const nhf = Math.round(p.basic * 0.025);
    const nhis = p.nhisOptIn ? p.nhisAmount : 0;
    const rentRelief = p.rentReliefApproved ? Math.min(p.rentPaid * 0.20, 500_000) : 0;
    const totalDeductions = pension + nhf + nhis + rentRelief + p.lifeInsurance;
    const chargeableAnnual = Math.max(grossAnnual - totalDeductions, 0);

    const bandSplits: { rate: number; income: number; tax: number }[] = [];
    let remaining = chargeableAnnual;
    let highestBand = 0;
    for (const b of PAYE_BANDS) {
        if (remaining <= 0) break;
        const bandSize = b.to === null ? remaining : Math.max(0, b.to - b.from);
        const incomeInBand = Math.min(remaining, bandSize);
        if (incomeInBand > 0) {
            const tax = Math.round(incomeInBand * (b.rate / 100));
            bandSplits.push({ rate: b.rate, income: incomeInBand, tax });
            remaining -= incomeInBand;
            if (b.rate > 0) highestBand = b.rate;
        }
    }
    const annualPaye = bandSplits.reduce((s, x) => s + x.tax, 0);
    const monthlyPaye = Math.round(annualPaye / 12);
    const monthlyGross = Math.round(grossAnnual / 12);
    const monthlyPension = Math.round(pension / 12);
    const monthlyNhf = Math.round(nhf / 12);
    const monthlyRentRelief = Math.round(rentRelief / 12);
    const monthlyNet = monthlyGross - monthlyPension - monthlyNhf - monthlyPaye - Math.round((nhis + p.lifeInsurance) / 12);
    const etr = chargeableAnnual > 0 ? (annualPaye / grossAnnual) * 100 : 0;
    const isExempt = chargeableAnnual <= 800_000;

    return {
        grossAnnual, pensionableAnnual, pension, nhf, nhis, rentRelief,
        lifeInsurance: p.lifeInsurance, totalDeductions, chargeableAnnual,
        bandSplits, annualPaye, monthlyPaye, monthlyGross, monthlyPension,
        monthlyNhf, monthlyRentRelief, monthlyNet, etr, highestBand, isExempt,
    };
}

export function validateForRun(employees: Employee[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    employees.forEach(e => {
        if (!e.profile.hasProfile) {
            issues.push({ employeeId: e.id, employeeName: e.name, severity: "error", message: "No PAYE profile configured" });
            return;
        }
        if (e.profile.rentPaid > 0 && !e.profile.rentReliefApproved) {
            issues.push({ employeeId: e.id, employeeName: e.name, severity: "warning", message: "Rent relief enabled but no approved claim" });
        }
        if (!e.profile.tin) {
            issues.push({ employeeId: e.id, employeeName: e.name, severity: "warning", message: "Missing TIN ΓÇö required for Form H1" });
        }
        if (!e.profile.state) {
            issues.push({ employeeId: e.id, employeeName: e.name, severity: "warning", message: "No state of residence" });
        }
    });
    return issues;
}

export function bandDistribution(run: PayrollRun) {
    const buckets: Record<number, { rate: number; count: number; totalPaye: number }> = {};
    run.entries.forEach(e => {
        const k = e.isExempt ? 0 : e.highestBand;
        if (!buckets[k]) buckets[k] = { rate: k, count: 0, totalPaye: 0 };
        buckets[k].count += 1;
        buckets[k].totalPaye += e.monthlyPaye;
    });
    return PAYE_BANDS.map(b => buckets[b.rate] ?? { rate: b.rate, count: 0, totalPaye: 0 })
        .filter(x => x.count > 0);
}

export { _bandColor as bandColor, _bandChipClasses as bandChipClasses };

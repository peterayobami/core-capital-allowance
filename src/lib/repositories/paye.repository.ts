import { EMPLOYEES, RUNS, CURRENT_PERIOD } from "@/lib/mock-data/paye";
import type { Employee, PayrollRun, Period } from "@/lib/models/paye";

export const payeRepository = {
    getEmployees: (): Employee[] => EMPLOYEES,
    getEmployeeById: (id: string): Employee | undefined => EMPLOYEES.find(e => e.id === id),
    getRuns: (): PayrollRun[] => RUNS,
    getRunByPeriod: (p: Period): PayrollRun | undefined =>
        RUNS.find(r => r.period.year === p.year && r.period.month === p.month),
    getCurrentPeriod: (): Period => CURRENT_PERIOD,
};

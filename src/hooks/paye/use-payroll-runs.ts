import { useQuery } from "@tanstack/react-query";
import { payeRepository } from "@/lib/repositories/paye.repository";

export const usePayrollRuns = () =>
    useQuery({ queryKey: ["payroll-runs"], queryFn: payeRepository.getRuns });

export const useCurrentPeriod = () =>
    useQuery({ queryKey: ["current-period"], queryFn: payeRepository.getCurrentPeriod });

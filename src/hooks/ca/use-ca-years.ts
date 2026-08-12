import { useQuery } from "@tanstack/react-query";
import { caRepository } from "@/lib/repositories/ca.repository";

export const useCAYears = () =>
    useQuery({ queryKey: ["ca-years"], queryFn: caRepository.getAll });

export const useCAYear = (fy: number) =>
    useQuery({ queryKey: ["ca-year", fy], queryFn: () => caRepository.getByFiscalYear(fy) });

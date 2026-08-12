import { useQuery } from "@tanstack/react-query";
import { payeRepository } from "@/lib/repositories/paye.repository";

export const useEmployees = () =>
    useQuery({ queryKey: ["employees"], queryFn: payeRepository.getEmployees });

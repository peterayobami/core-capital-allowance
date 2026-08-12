import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeRepository } from "@/lib/repositories/employee.repository";
import type { HrEmployee } from "@/lib/models/employee";

export const hrEmployeeKeys = {
  all: ["hr-employees"] as const,
  detail: (id: string) => ["hr-employees", id] as const,
};

export const useHrEmployees = () =>
  useQuery({ queryKey: hrEmployeeKeys.all, queryFn: employeeRepository.list });

export const useHrEmployee = (id: string) =>
  useQuery({ queryKey: hrEmployeeKeys.detail(id), queryFn: () => employeeRepository.getById(id), enabled: !!id });

export const useCreateHrEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<HrEmployee, "id">) => Promise.resolve(employeeRepository.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrEmployeeKeys.all }),
  });
};

export const useUpdateHrEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HrEmployee> }) =>
      Promise.resolve(employeeRepository.update(id, data)),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: hrEmployeeKeys.all });
      qc.invalidateQueries({ queryKey: hrEmployeeKeys.detail(v.id) });
    },
  });
};

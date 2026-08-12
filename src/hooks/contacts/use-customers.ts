import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerRepository } from "@/lib/repositories/customer.repository";
import type { Customer } from "@/lib/models/customer";

export const customerKeys = {
  all: ["customers"] as const,
  detail: (id: string) => ["customers", id] as const,
};

export const useCustomers = () =>
  useQuery({ queryKey: customerKeys.all, queryFn: customerRepository.list });

export const useCustomer = (id: string) =>
  useQuery({ queryKey: customerKeys.detail(id), queryFn: () => customerRepository.getById(id), enabled: !!id });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Customer, "id">) => Promise.resolve(customerRepository.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      Promise.resolve(customerRepository.update(id, data)),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.detail(v.id) });
    },
  });
};

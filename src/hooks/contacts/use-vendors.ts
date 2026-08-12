import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorRepository } from "@/lib/repositories/vendor.repository";
import type { Vendor } from "@/lib/models/vendor";

export const vendorKeys = {
  all: ["vendors"] as const,
  detail: (id: string) => ["vendors", id] as const,
};

export const useVendors = () =>
  useQuery({ queryKey: vendorKeys.all, queryFn: vendorRepository.list });

export const useVendor = (id: string) =>
  useQuery({ queryKey: vendorKeys.detail(id), queryFn: () => vendorRepository.getById(id), enabled: !!id });

export const useCreateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Vendor, "id">) => Promise.resolve(vendorRepository.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: vendorKeys.all }),
  });
};

export const useUpdateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vendor> }) =>
      Promise.resolve(vendorRepository.update(id, data)),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: vendorKeys.all });
      qc.invalidateQueries({ queryKey: vendorKeys.detail(v.id) });
    },
  });
};

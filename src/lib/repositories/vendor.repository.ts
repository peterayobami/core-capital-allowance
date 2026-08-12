import { VENDORS } from "@/lib/mock-data/vendor";
import type { Vendor } from "@/lib/models/vendor";

let store: Vendor[] = [...VENDORS];

export const vendorRepository = {
  list: (): Vendor[] => [...store],
  getById: (id: string): Vendor | undefined => store.find(v => v.id === id),
  create: (data: Omit<Vendor, "id">): Vendor => {
    const id = `V${String(store.length + 1).padStart(3, "0")}`;
    const v = { ...data, id };
    store = [v, ...store];
    return v;
  },
  update: (id: string, data: Partial<Vendor>): Vendor | undefined => {
    store = store.map(v => v.id === id ? { ...v, ...data } : v);
    return store.find(v => v.id === id);
  },
};

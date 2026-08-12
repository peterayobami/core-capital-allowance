import { CUSTOMERS } from "@/lib/mock-data/customer";
import type { Customer } from "@/lib/models/customer";

let store: Customer[] = [...CUSTOMERS];

export const customerRepository = {
  list: (): Customer[] => [...store],
  getById: (id: string): Customer | undefined => store.find(c => c.id === id),
  create: (data: Omit<Customer, "id">): Customer => {
    const id = `C${String(store.length + 1).padStart(3, "0")}`;
    const c = { ...data, id };
    store = [c, ...store];
    return c;
  },
  update: (id: string, data: Partial<Customer>): Customer | undefined => {
    store = store.map(c => c.id === id ? { ...c, ...data } : c);
    return store.find(c => c.id === id);
  },
};

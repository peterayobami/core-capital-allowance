import { HR_EMPLOYEES } from "@/lib/mock-data/employee";
import type { HrEmployee } from "@/lib/models/employee";

let store: HrEmployee[] = [...HR_EMPLOYEES];

export const employeeRepository = {
  list: (): HrEmployee[] => [...store],
  getById: (id: string): HrEmployee | undefined => store.find(e => e.id === id),
  create: (data: Omit<HrEmployee, "id">): HrEmployee => {
    const next = store.length + 1;
    const id = `EMP-${String(next).padStart(3, "0")}`;
    const e = { ...data, id };
    store = [e, ...store];
    return e;
  },
  update: (id: string, data: Partial<HrEmployee>): HrEmployee | undefined => {
    store = store.map(e => e.id === id ? { ...e, ...data } : e);
    return store.find(e => e.id === id);
  },
};

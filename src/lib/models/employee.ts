// HR Employee model (distinct from PAYE Employee — composes a PAYE profile when needed)
import type { PayeProfile } from "./paye";

export type HrEmployee = {
  id: string;          // EMP-001
  firstName: string;
  lastName: string;
  department: string;
  title?: string;
  email: string;
  phone: string;
  payeProfile?: PayeProfile;
};

export const fullName = (e: { firstName: string; lastName: string }) => `${e.firstName} ${e.lastName}`;

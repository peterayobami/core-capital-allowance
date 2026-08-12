import type { Vendor } from "@/lib/models/vendor";

export const VENDORS: Vendor[] = [
  {
    id: "V001",
    companyName: "Torque Motors Nigeria Ltd",
    companyEmail: "info@torquemotors.ng",
    companyPhone: "+234 809 876 5432",
    address: "7 Norman Williams Street, Ikoyi, Lagos",
    contact: { fullName: "Ronald Richards", role: "Regional Manager", email: "ronald.r@torquemotors.ng", phone: "+234 809 876 5433" },
  },
  {
    id: "V002",
    companyName: "Auto Prime Supplies Ltd",
    companyEmail: "info@autoprime.com",
    companyPhone: "+234 801 234 5678",
    address: "14 Adeola Odeku St, Victoria Island, Lagos",
    contact: { fullName: "Cameron Williamson", role: "Sales Representative", email: "cameron.w@autoprime.com", phone: "+234 801 234 5679" },
  },
];

// Customer model
export type CustomerType = "Individual" | "Organization" | "Non-Profit" | "Government";

export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  type: CustomerType;
  totalInvoices?: number;
  totalRevenue?: number;
  totalVat?: number;
};

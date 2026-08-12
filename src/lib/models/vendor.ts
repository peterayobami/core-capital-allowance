// Vendor model
export type Vendor = {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  address: string;
  contact?: {
    fullName: string;
    role: string;
    email?: string;
    phone?: string;
  };
  totalPurchases?: number;
  totalAmount?: number;
  outstanding?: number;
};

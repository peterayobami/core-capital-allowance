export type AssetClassification =
  | "Office Furniture"
  | "Computer Equipment"
  | "Motor Vehicles"
  | "Plant & Machinery"
  | "Office Equipment"
  | "Building";

export interface AssetItem {
  id: string;
  dateCreated: string; // ISO
  description: string;
  cost: number;
  datePurchased: string; // ISO
  classification: AssetClassification;
  remarks?: string;
  /** 🔌 BACKEND: COA account code (1500-series Non-current Asset) the asset is capitalised to. */
  coaAccountCode?: string;
}

export interface PurchaseItem {
  id: string;
  date: string;
  invoiceNo: string;
  description: string;
  vendor: string;
  cost: number;
  vat: boolean;
  whtPct?: number; // null/0 means no
  /** 🔌 BACKEND: COA Cost-of-Sales account (5xxx) debited on journal posting. */
  coaAccountCode?: string;
}

export interface RevenueItem {
  id: string;
  date: string;
  invoiceNo: string;
  description: string;
  customer: string;
  category: string;
  sales: number;
  vat: boolean;
  /** 🔌 BACKEND: COA Revenue account (4xxx) credited on journal posting. */
  coaAccountCode?: string;
}

export interface ExpenseItem {
  id: string;
  date: string;
  invoiceNo: string;
  description: string;
  supplier: string;
  category: string;
  cost: number;
  deductible: boolean;
  /** 🔌 BACKEND: COA Expense account (6xxx) debited on journal posting. */
  coaAccountCode?: string;
}

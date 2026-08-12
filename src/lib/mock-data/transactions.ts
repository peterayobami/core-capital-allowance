import type {
  AssetItem, PurchaseItem, RevenueItem, ExpenseItem, AssetClassification,
} from "@/lib/models/transactions";

const CLASSIFICATIONS: AssetClassification[] = [
  "Office Furniture", "Computer Equipment", "Motor Vehicles",
  "Plant & Machinery", "Office Equipment", "Building",
];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function iso(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }

const VENDORS = [
  "Crystal Cleaning Co.", "Lagos Office Supplies", "Zenith Print Media",
  "Northern Steel Works", "GreenLeaf Stationery", "PowerGen Generators",
  "Atlas Security Services", "TechHub Nigeria Ltd", "Pinnacle IT Solutions",
  "Sahara Catering Services", "BlueMoon Logistics",
];

const CUSTOMERS = [
  "Hope Foundation NG", "Federal Ministry of Works", "BrightFuture NGO",
  "Lagos State Govt", "Andela Inc.", "First City Monument Bank",
  "Folake Adeyemi", "Aisha Mohammed", "Acme Manufacturing Corp",
  "Dangote Industries Ltd",
];

const REV_CATEGORIES = [
  "Training & Workshops", "Consulting Services", "Other Income",
  "Maintenance Contracts", "Product Sales", "Licensing",
];
const EXP_CATEGORIES = [
  "Office Supplies", "Travel & Transport", "Rent & Utilities",
  "Repairs & Maintenance", "Professional Fees", "Marketing",
];

const ASSET_DESCRIPTIONS = [
  "Visitor Lounge Chairs (set of 4)", "Coffee Machine — Commercial",
  "Bookshelf Mahogany", "Toyota Hilux 2022", "Surveillance Camera Kit (8ch)",
  "Standing Desk Adjustable", "Server Rack 42U", "20 KVA Diesel Generator",
  "Office Building — Annex", "iPad Pro 12.9\"", "MacBook Pro 16\"",
  "Conference Table — Oak", "Industrial Printer", "Forklift 2-ton",
];

const PURCHASE_DESCRIPTIONS = [
  "Phone Accessories", "Event Decorations", "Wall Paint — Office Refresh",
  "Catering — Staff Retreat", "USB-C Hubs (bulk)", "External SSD 2TB (5x)",
  "Networking Cables CAT-6", "Stationery Bulk Purchase", "Carpet Tiles Replacement",
  "Promotional Banners Batch", "Office Chairs (10)", "Kitchen Supplies",
];

const REVENUE_DESCRIPTIONS = [
  "Implementation Services", "License Renewal", "Custom Development Sprint",
  "Retainer Top-up", "Data Migration Engagement", "Setup & Onboarding Fee",
  "Training Workshop", "New Customer Onboarding", "Donation Acknowledged",
  "Year-End Advisory", "Quarterly Retainer", "Solution Architecture",
];

const EXPENSE_DESCRIPTIONS = [
  "Hotel Accommodation", "PAYE Remittance", "Office Repairs",
  "Mobile Airtime Bulk", "Monthly Office Rent", "Repairs — Air Conditioner",
  "Travel — Abuja Trip", "Office Insurance Premium", "Software Subscriptions",
  "Security Service Monthly", "Internet Subscription", "Diesel Refill",
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function rand(seed: number) {
  // deterministic pseudo-random
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const ASSETS: AssetItem[] = Array.from({ length: 44 }).map((_, i) => {
  const day = ((i * 7) % 27) + 1;
  const month = ((i * 3) % 12) + 1;
  const year = 2025 + (i % 2);
  return {
    id: `A${(i + 1).toString().padStart(4, "0")}`,
    dateCreated: iso(year, month, day),
    description: pick(ASSET_DESCRIPTIONS, i),
    cost: Math.round(rand(i + 1) * 9_500_000) + 250_000,
    datePurchased: iso(year, month, day),
    classification: pick(CLASSIFICATIONS, i),
    remarks: i % 3 === 0 ? "Capitalized this period" : undefined,
  };
});

export const PURCHASES: PurchaseItem[] = Array.from({ length: 40 }).map((_, i) => {
  const day = ((i * 5) % 27) + 1;
  const month = ((i * 2) % 12) + 1;
  const year = 2025 + (i % 2);
  return {
    id: `P${(i + 1).toString().padStart(4, "0")}`,
    date: iso(year, month, day),
    invoiceNo: `INV-2025-${(i + 50).toString().padStart(4, "0")}`,
    description: pick(PURCHASE_DESCRIPTIONS, i),
    vendor: pick(VENDORS, i),
    cost: Math.round(rand(i + 100) * 4_500_000) + 250_000,
    vat: i % 6 !== 0,
    whtPct: i % 4 === 0 ? (i % 8 === 0 ? 10 : 5) : 0,
  };
});

export const REVENUES: RevenueItem[] = Array.from({ length: 40 }).map((_, i) => {
  const day = ((i * 4) % 27) + 1;
  const month = ((i * 2) % 12) + 1;
  const year = 2025 + (i % 2);
  return {
    id: `R${(i + 1).toString().padStart(4, "0")}`,
    date: iso(year, month, day),
    invoiceNo: `INV-OUT-2025-${(i + 12).toString().padStart(4, "0")}`,
    description: pick(REVENUE_DESCRIPTIONS, i),
    customer: pick(CUSTOMERS, i),
    category: pick(REV_CATEGORIES, i),
    sales: Math.round(rand(i + 200) * 18_000_000) + 500_000,
    vat: i % 7 !== 0,
  };
});

export const EXPENSES: ExpenseItem[] = Array.from({ length: 40 }).map((_, i) => {
  const day = ((i * 6) % 27) + 1;
  const month = ((i * 2) % 12) + 1;
  const year = 2025 + (i % 2);
  return {
    id: `E${(i + 1).toString().padStart(4, "0")}`,
    date: iso(year, month, day),
    invoiceNo: `INV-EXP-${(i + 80).toString().padStart(4, "0")}`,
    description: pick(EXPENSE_DESCRIPTIONS, i),
    supplier: pick(VENDORS, i),
    category: pick(EXP_CATEGORIES, i),
    cost: Math.round(rand(i + 300) * 2_900_000) + 100_000,
    deductible: i % 9 !== 0,
  };
});

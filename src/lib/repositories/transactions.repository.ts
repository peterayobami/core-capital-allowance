import { ASSETS, PURCHASES, REVENUES, EXPENSES } from "@/lib/mock-data/transactions";

export const transactionsRepository = {
  listAssets: () => ASSETS,
  listPurchases: () => PURCHASES,
  listRevenues: () => REVENUES,
  listExpenses: () => EXPENSES,
};

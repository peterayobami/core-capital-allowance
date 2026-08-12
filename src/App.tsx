import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/ca/Overview";
import Schedule from "./pages/ca/Schedule";
import Classifications from "./pages/ca/Classifications";
import History from "./pages/ca/History";
import TaxComputation from "./pages/TaxComputation";
import Placeholder from "./pages/Placeholder";
import PayrollRuns from "./pages/paye/PayrollRuns";
import PayrollRunDetail from "./pages/paye/PayrollRunDetail";
import PayeEmployees from "./pages/paye/Employees";
import PayeRemittance from "./pages/paye/Remittance";
import PayeTaxBands from "./pages/paye/TaxBands";
import PayePortal from "./pages/paye/Portal";
import VendorsPage from "./pages/contacts/Vendors";
import VendorDetailPage from "./pages/contacts/VendorDetail";
import CustomersPage from "./pages/contacts/Customers";
import CustomerDetailPage from "./pages/contacts/CustomerDetail";
import EmployeesPage from "./pages/contacts/Employees";
import EmployeeDetailPage from "./pages/contacts/EmployeeDetail";
import AssetsPage from "./pages/transactions/Assets";
import PurchasesPage from "./pages/transactions/Purchases";
import RevenuePage from "./pages/transactions/Revenue";
import ExpensesPage from "./pages/transactions/Expenses";
import VatPage from "./pages/taxation/Vat";
import WhtPage from "./pages/taxation/Wht";
import IncomeTaxesPage from "./pages/taxation/IncomeTaxes";
import ProfitAndLossPage from "./pages/reports/ProfitAndLoss";
import BalanceSheetPage from "./pages/reports/balance-sheet";
import CashFlowPage from "./pages/reports/cash-flow";
import TrialBalancePage from "./pages/reports/trial-balance";
import ChartsOfAccountsPage from "./pages/books/charts-of-accounts";
import JournalsPage from "./pages/books/journals";
import CompanyProfilePage from "./pages/settings/CompanyProfile";
import FiscalYearsPage from "./pages/settings/FiscalYears";
import OpeningBalancesPage from "./pages/settings/OpeningBalances";
import TaxConfigPage from "./pages/settings/TaxConfig";
import SettingsPlaceholder from "./pages/settings/SettingsPlaceholder";
import UserSettings from "./pages/settings/UserSettings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Contacts */}
            <Route path="/contacts/vendors" element={<VendorsPage />} />
            <Route path="/contacts/vendors/:id" element={<VendorDetailPage />} />
            <Route path="/contacts/customers" element={<CustomersPage />} />
            <Route path="/contacts/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/contacts/employees" element={<EmployeesPage />} />
            <Route path="/contacts/employees/:id" element={<EmployeeDetailPage />} />

            {/* Reports */}
            <Route path="/reports/profit-and-loss" element={<ProfitAndLossPage />} />
            <Route path="/reports/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="/reports/cash-flow" element={<CashFlowPage />} />
            <Route path="/reports/trial-balance" element={<TrialBalancePage />} />

            {/* Books */}
            <Route path="/books/charts-of-accounts" element={<ChartsOfAccountsPage />} />
            <Route path="/books/journals" element={<JournalsPage />} />

            <Route path="/transactions/revenue" element={<RevenuePage />} />
            <Route path="/transactions/purchases" element={<PurchasesPage />} />
            <Route path="/transactions/expenses" element={<ExpensesPage />} />
            <Route path="/transactions/assets" element={<AssetsPage />} />
            <Route path="/assets/register" element={<Placeholder title="Asset Register" breadcrumbs={["Assets", "Asset Register"]} />} />
            <Route path="/assets/classifications" element={<Classifications />} />
            <Route path="/taxation/capital-allowance" element={<Overview />} />
            <Route path="/taxation/capital-allowance/schedule" element={<Schedule />} />
            <Route path="/taxation/capital-allowance/classifications" element={<Classifications />} />
            <Route path="/taxation/capital-allowance/history" element={<History />} />
            <Route path="/taxation/tax-computation" element={<TaxComputation />} />
            <Route path="/taxation/paye" element={<PayrollRuns />} />
            <Route path="/taxation/paye/runs/:runKey" element={<PayrollRunDetail />} />
            <Route path="/taxation/paye/employees" element={<PayeEmployees />} />
            <Route path="/taxation/paye/remittance" element={<PayeRemittance />} />
            <Route path="/taxation/paye/portal" element={<PayePortal />} />
            <Route path="/taxation/paye/bands" element={<PayeTaxBands />} />
            <Route path="/taxation/vat" element={<VatPage />} />
            <Route path="/taxation/wht" element={<WhtPage />} />
            <Route path="/taxation/income-taxes" element={<IncomeTaxesPage />} />
            <Route path="/taxation/income-tax" element={<IncomeTaxesPage />} />
            <Route path="/reports" element={<ProfitAndLossPage />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/settings/org" element={<CompanyProfilePage />} />
            <Route path="/settings/org/company" element={<CompanyProfilePage />} />
            <Route path="/settings/org/fiscal-years" element={<FiscalYearsPage />} />
            <Route path="/settings/org/opening-balances" element={<OpeningBalancesPage />} />
            <Route path="/settings/org/tax-config" element={<TaxConfigPage />} />
            <Route path="/settings/org/users" element={<SettingsPlaceholder title="Users & Permissions" />} />
            <Route path="/settings/org/integrations" element={<SettingsPlaceholder title="Integrations" />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

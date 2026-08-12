import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportKpi, ReportKpiStrip, PageCard } from "@/components/reports/ReportPrimitives";
import { SidePanel } from "@/components/shared/SidePanel";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Network, ShieldCheck, Boxes, Scale, Plus, Pencil, Power } from "lucide-react";
import {
  COA_ACCOUNTS, ACCOUNT_TYPE_ORDER, ACCOUNT_TYPE_LABEL,
  getAccountBalance,
} from "@/lib/services/ledger.service";
import type { ChartOfAccount, AccountType, NormalBalance } from "@/lib/models/ledger";
import { isHeaderAccount } from "@/lib/mock-data/coa";
import { formatNGN } from "@/lib/utils/format";
import { defaultYear } from "@/lib/services/tax.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_FILTERS: Array<{ value: "all" | AccountType; label: string }> = [
  { value: "all",         label: "All Types" },
  { value: "Asset",       label: "Asset" },
  { value: "Liability",   label: "Liability" },
  { value: "Equity",      label: "Equity" },
  { value: "Revenue",     label: "Revenue" },
  { value: "CostOfSales", label: "Cost of Sales" },
  { value: "Expense",     label: "Expense" },
  { value: "TaxExpense",  label: "Tax Expense" },
];

export default function ChartsOfAccountsPage() {
  // 🔌 BACKEND: Load COA from `GET /api/accounts?tenantId=...`. The local
  // `COA_ACCOUNTS` array is a tenant-default seed for the mock environment only.
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(COA_ACCOUNTS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AccountType>("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<ChartOfAccount | null>(null);

  const year = defaultYear();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter(a => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (!q) return true;
      return a.code.includes(q) || a.name.toLowerCase().includes(q) || a.subType.toLowerCase().includes(q);
    });
  }, [accounts, search, typeFilter]);

  // ── KPIs ──
  const totalNonHeader = accounts.filter(a => !isHeaderAccount(a)).length;
  const activeCount    = accounts.filter(a => a.isActive && !isHeaderAccount(a)).length;
  const assetCount     = accounts.filter(a => a.type === "Asset" && !isHeaderAccount(a)).length;
  const liabilityCount = accounts.filter(a => a.type === "Liability" && !isHeaderAccount(a)).length;

  // 🔌 BACKEND: Replace with `GET /api/accounts/balances?year={year}`.
  const balanceFor = (code: string): number => {
    if (isHeaderAccount({ code } as ChartOfAccount)) return 0;
    return getAccountBalance(code, year, "full");
  };

  // ── Group accounts by type, in spec order ──
  const grouped = useMemo(() => {
    return ACCOUNT_TYPE_ORDER.map(type => ({
      type,
      label: ACCOUNT_TYPE_LABEL[type],
      accounts: filtered.filter(a => a.type === type),
    })).filter(g => g.accounts.length > 0);
  }, [filtered]);

  function handleSave(values: ChartOfAccount) {
    setAccounts(prev => {
      const exists = prev.some(a => a.code === values.code);
      if (exists && editing && editing.code === values.code) {
        return prev.map(a => a.code === values.code ? values : a);
      }
      if (exists) {
        toast.error(`Account code ${values.code} already exists.`);
        return prev;
      }
      return [...prev, values].sort((a, b) => a.code.localeCompare(b.code));
    });
    toast.success(editing ? "Account updated" : "Account created");
    // 🔌 BACKEND: POST/PUT to `/api/accounts` here.
    setPanelOpen(false);
    setEditing(null);
  }

  function handleToggleActive(code: string) {
    setAccounts(prev => prev.map(a => a.code === code ? { ...a, isActive: !a.isActive } : a));
    // 🔌 BACKEND: PATCH `/api/accounts/${code}` { isActive }
  }

  return (
    <AppShell title="Charts of Account">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Books</div>
            <h1 className="text-xl font-semibold mt-1">Charts of Account</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Nominal ledger accounts for your company.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search code or name…" />
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | AccountType)}>
              <SelectTrigger className="h-9 w-[160px] text-sm bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => { setEditing(null); setPanelOpen(true); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Account
            </Button>
          </div>
        </header>

        {/* KPI strip */}
        <ReportKpiStrip>
          <ReportKpi label="Total Accounts" value={totalNonHeader.toString()}
            hint="Excludes parent header accounts" icon={Network} tone="primary" />
          <ReportKpi label="Active Accounts" value={activeCount.toString()}
            hint="Currently in use" icon={ShieldCheck} tone="success" />
          <ReportKpi label="Asset Accounts" value={assetCount.toString()}
            hint="1xxx series" icon={Boxes} tone="skyblue" />
          <ReportKpi label="Liability Accounts" value={liabilityCount.toString()}
            hint="2xxx series" icon={Scale} tone="warning" />
        </ReportKpiStrip>

        {/* Account register — grouped accordion */}
        <PageCard title="Account Register">
          <div className="space-y-3">
            {grouped.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No accounts match the current filters.
              </p>
            )}
            {grouped.map(group => (
              <AccountGroup
                key={group.type}
                label={group.label}
                accounts={group.accounts}
                balanceFor={balanceFor}
                onEdit={(a) => { setEditing(a); setPanelOpen(true); }}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </PageCard>
      </div>

      <AccountSidePanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null); }}
        onSave={handleSave}
        editing={editing}
        existingCodes={accounts.map(a => a.code)}
      />
    </AppShell>
  );
}

/* ───────────────────────── Account Group ───────────────────────── */

function AccountGroup({
  label, accounts, balanceFor, onEdit, onToggleActive,
}: {
  label: string;
  accounts: ChartOfAccount[];
  balanceFor: (code: string) => number;
  onEdit: (a: ChartOfAccount) => void;
  onToggleActive: (code: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const nonHeaderCount = accounts.filter(a => !isHeaderAccount(a)).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors text-left">
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">{label}</span>
          <span className="ml-1 text-[11px] text-muted-foreground">({nonHeaderCount} accounts)</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="overflow-x-auto mt-1">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="w-8 py-2 px-3"></th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[80px]">Code</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Account Name</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Sub-Type</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-[60px]">Dr/Cr</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground fig">Balance</th>
                <th className="w-12 py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => {
                const isHeader = isHeaderAccount(a);
                if (isHeader) {
                  return (
                    <tr key={a.code} className="border-b border-border/50 bg-muted/30">
                      <td colSpan={6} className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {a.code} · {a.name}
                      </td>
                      <td></td>
                    </tr>
                  );
                }
                const balance = balanceFor(a.code);
                return (
                  <tr key={a.code} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-3">
                      <span className={cn(
                        "status-dot",
                        a.isActive ? "bg-success" : "bg-border-strong",
                      )} />
                    </td>
                    <td className="py-2 px-3 mono">{a.code}</td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-foreground">{a.name}</div>
                      {a.description && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-md">{a.description}</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{a.subType}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-semibold",
                        a.normalBalance === "Debit"
                          ? "bg-primary/12 text-primary"
                          : "bg-success/15 text-success",
                      )}>
                        {a.normalBalance === "Debit" ? "Dr" : "Cr"}
                      </span>
                    </td>
                    <td className={cn(
                      "py-2 px-3 mono text-right",
                      a.normalBalance === "Credit" ? "text-success" : "text-foreground",
                    )}>
                      {formatNGN(balance)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => onEdit(a)}
                          className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleActive(a.code)}
                          className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-warning hover:bg-warning/10"
                          title={a.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ───────────────────────── Add / Edit panel ───────────────────────── */

function AccountSidePanel({
  open, onClose, onSave, editing, existingCodes,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (a: ChartOfAccount) => void;
  editing: ChartOfAccount | null;
  existingCodes: string[];
}) {
  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<AccountType>(editing?.type ?? "Asset");
  const [subType, setSubType] = useState(editing?.subType ?? "");
  const [normalBalance, setNormalBalance] = useState<NormalBalance>(editing?.normalBalance ?? "Debit");
  const [parentCode, setParentCode] = useState(editing?.parentCode ?? "none");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  // Reset state when panel opens with a different editing target
  useMemo(() => {
    setCode(editing?.code ?? "");
    setName(editing?.name ?? "");
    setType(editing?.type ?? "Asset");
    setSubType(editing?.subType ?? "");
    setNormalBalance(editing?.normalBalance ?? "Debit");
    setParentCode(editing?.parentCode ?? "none");
    setDescription(editing?.description ?? "");
    setIsActive(editing?.isActive ?? true);
  }, [editing, open]);

  // Lock type if editing an account that has children
  const hasChildren = !!editing && COA_ACCOUNTS.some(a => a.parentCode === editing.code);

  // If a parent is selected, type is inherited (locked)
  const parentObj = parentCode !== "none" ? COA_ACCOUNTS.find(a => a.code === parentCode) : undefined;
  const typeLocked = hasChildren || !!parentObj;
  const effectiveType: AccountType = parentObj ? parentObj.type : type;

  function handleTypeChange(t: AccountType) {
    if (typeLocked) return;
    setType(t);
    if (t === "Liability" || t === "Equity" || t === "Revenue") setNormalBalance("Credit");
    else setNormalBalance("Debit");
  }

  const codeValid = /^\d{4}$/.test(code);
  const codeUnique = editing ? true : !existingCodes.includes(code);
  const canSave = codeValid && codeUnique && name.trim().length > 0 && subType.trim().length > 0;

  function submit() {
    if (!canSave) return;
    onSave({
      code, name: name.trim(),
      type: effectiveType,
      subType: subType.trim(), normalBalance,
      parentCode: parentCode === "none" ? undefined : parentCode,
      description: description.trim() || undefined,
      isActive,
    });
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={editing ? "Edit Account" : "Add Account"}
      description={editing ? `Update account ${editing.code}` : "Create a new ledger account"}
      icon={<Network className="h-5 w-5" />}
      iconBg="hsl(var(--primary) / 0.12)"
      iconColor="hsl(var(--primary))"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {editing ? "Save Changes" : "Create Account"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="acct-code">Account Code *</Label>
            <Input
              id="acct-code" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 1100" maxLength={4} disabled={!!editing}
              className={cn("mono", !codeValid && code && "border-danger")}
            />
            {!codeValid && code && (
              <p className="text-[11px] text-danger mt-1">Must be exactly 4 digits.</p>
            )}
            {!codeUnique && (
              <p className="text-[11px] text-danger mt-1">Code already exists.</p>
            )}
          </div>
          <div>
            <Label htmlFor="acct-active">Active</Label>
            <div className="h-9 flex items-center gap-2">
              <Switch id="acct-active" checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="acct-name">Account Name *</Label>
          <Input id="acct-name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cash & Bank" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="flex items-center gap-1">
              Account Type *
              {typeLocked && <span title="Inherited from parent / has children">🔒</span>}
            </Label>
            <Select value={effectiveType} onValueChange={(v) => handleTypeChange(v as AccountType)} disabled={typeLocked}>
              <SelectTrigger className={cn("bg-card", typeLocked && "opacity-60")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.filter(t => t.value !== "all").map(t => (
                  <SelectItem key={t.value} value={t.value as string}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasChildren && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Locked — this account has child accounts that would be affected.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="acct-subtype">Sub-Type *</Label>
            <Input id="acct-subtype" value={subType} onChange={(e) => setSubType(e.target.value)}
              placeholder="e.g. Current Asset" />
          </div>
        </div>

        <div>
          <Label>Normal Balance</Label>
          <div className="flex gap-2 mt-1">
            {(["Debit", "Credit"] as NormalBalance[]).map(nb => (
              <button
                key={nb} type="button"
                onClick={() => setNormalBalance(nb)}
                className={cn(
                  "flex-1 h-9 rounded-lg border text-sm font-medium transition-colors",
                  normalBalance === nb
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {nb}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Auto-suggested from account type — override only when needed (e.g. contra-asset).
          </p>
        </div>

        <div>
          <Label>Parent Account (optional)</Label>
          <Select value={parentCode} onValueChange={setParentCode}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {COA_ACCOUNTS
                .filter(a => isHeaderAccount(a))
                .filter(a => parentCode !== "none" || type === a.type) // when no parent yet, filter to selected type
                .map(a => (
                  <SelectItem key={a.code} value={a.code}>{a.code} · {a.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Account type is inherited from the parent. Sub-accounts cannot change type independently.
          </p>
        </div>

        <div>
          <Label htmlFor="acct-desc">Description (optional)</Label>
          <Textarea id="acct-desc" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this account captures" rows={3} />
        </div>
      </div>
    </SidePanel>
  );
}

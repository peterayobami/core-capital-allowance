import { useState, useEffect, useMemo } from "react";
import { Receipt } from "lucide-react";
import { SidePanel } from "@/components/shared/SidePanel";
import { Field, FormInput, FormTextarea } from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VENDORS } from "@/lib/mock-data/vendor";
import { COA_ACCOUNTS } from "@/lib/mock-data/coa";
import type { ExpenseItem } from "@/lib/models/transactions";
import { formatNGN } from "@/lib/utils/format";
import { toast } from "sonner";

const EXP_COA = COA_ACCOUNTS.filter(a => a.type === "Expense" && a.subType !== "Header");
const EXP_CATEGORIES = EXP_COA.map(a => a.name);

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: (item: ExpenseItem) => void;
    initial?: ExpenseItem | null;
}

interface FormState {
    description: string;
    invoiceNo: string;
    cost: string;
    date: string;
    supplier: string;
    category: string;
    deductible: boolean;
    nonDeductibleReason: string;
    vat: boolean;
    whtApplicable: boolean;
    whtPct: string;
    coaAccountCode: string;
    remarks: string;
}

const empty = (): FormState => ({
    description: "", invoiceNo: "", cost: "", date: "", supplier: "", category: "", deductible: true, nonDeductibleReason: "", vat: false, whtApplicable: false, whtPct: "", coaAccountCode: "", remarks: "",
});

export function ExpenseFormPanel({ open, onClose, onSaved, initial }: Props) {
    const [s, setS] = useState<FormState>(empty());
    const [submitted, setSubmitted] = useState(false);

    const isEdit = !!initial;

    useEffect(() => {
        if (!open) return;
        setSubmitted(false);
        if (initial) {
            setS({
                description: initial.description,
                invoiceNo: initial.invoiceNo,
                cost: initial.cost.toString(),
                date: initial.date.slice(0, 10),
                supplier: initial.supplier,
                category: initial.category,
                deductible: initial.deductible,
                nonDeductibleReason: "",
                vat: false,
                whtApplicable: false,
                whtPct: "",
                coaAccountCode: initial.coaAccountCode ?? "",
                remarks: "",
            });
        } else {
            setS(empty());
        }
    }, [open, initial]);

    const errors = useMemo(() => {
        if (!submitted) return {} as Record<string, string>;
        const e: Record<string, string> = {};
        if (!s.description.trim()) e.description = "Description is required.";
        if (!s.invoiceNo.trim()) e.invoiceNo = "Invoice number is required.";
        if (!s.cost || Number(s.cost) <= 0) e.cost = "Cost must be greater than 0.";
        if (!s.supplier) e.supplier = "Please select a supplier.";
        if (!s.category) e.category = "Please select a category.";
        if (!s.date) e.date = "Date is required.";
        if (!s.deductible && !s.nonDeductibleReason.trim()) e.nonDeductibleReason = "Reason is required.";
        if (s.whtApplicable && !s.whtPct) e.whtPct = "Select a WHT rate.";
        return e;
    }, [submitted, s]);

    const costNum = Number(s.cost) || 0;
    const vatPreview = s.vat ? costNum * 0.075 : 0;
    const whtPreview = s.whtApplicable ? costNum * (Number(s.whtPct) / 100) : 0;

    function handleSubmit() {
        setSubmitted(true);
        if (!s.description.trim() || !s.invoiceNo.trim() || !s.cost || Number(s.cost) <= 0 || !s.supplier || !s.category || !s.date) return;
        if (!s.deductible && !s.nonDeductibleReason.trim()) return;
        if (s.whtApplicable && !s.whtPct) return;
        const item: ExpenseItem = {
            id: initial?.id ?? `E${Date.now()}`,
            date: s.date,
            invoiceNo: s.invoiceNo.trim(),
            description: s.description.trim(),
            supplier: s.supplier,
            category: s.category,
            cost: Number(s.cost),
            deductible: s.deductible,
            coaAccountCode: s.coaAccountCode || undefined,
        };
        onSaved(item);
        toast.success(isEdit ? "Expense updated" : "Expense created");
        onClose();
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <SidePanel
            open={open}
            onClose={onClose}
            title={isEdit ? "Edit Expense" : "New Expense"}
            icon={<Receipt size={18} />}
            iconBg="rgba(239,68,68,0.12)"
            iconColor="var(--cl-danger, #EF4444)"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Expense"}</Button>
                </>
            }
        >
            <div className="space-y-5">
                <Field label="Description" required error={errors.description}>
                    <FormInput value={s.description} onChange={e => setS(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Office Rent" error={!!errors.description} />
                </Field>

                <Field label="Invoice Number" required error={errors.invoiceNo}>
                    <FormInput value={s.invoiceNo} onChange={e => setS(p => ({ ...p, invoiceNo: e.target.value }))} placeholder="INV-EXP-0001" error={!!errors.invoiceNo} />
                </Field>

                <Field label="Cost (₦)" required error={errors.cost}>
                    <FormInput type="number" value={s.cost} onChange={e => setS(p => ({ ...p, cost: e.target.value }))} placeholder="e.g. 1200000" error={!!errors.cost} />
                </Field>

                <Field label="Supplier" required error={errors.supplier}>
                    <Select value={s.supplier} onValueChange={v => setS(p => ({ ...p, supplier: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select supplier…" /></SelectTrigger>
                        <SelectContent>
                            {VENDORS.map(v => <SelectItem key={v.id} value={v.companyName}>{v.companyName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Expense Category" required error={errors.category}>
                    <Select value={s.category} onValueChange={v => setS(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                        <SelectContent>
                            {EXP_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Date" required error={errors.date}>
                    <FormInput type="date" value={s.date} max={today} onChange={e => setS(p => ({ ...p, date: e.target.value }))} error={!!errors.date} />
                </Field>

                <Field label="Tax Deductible">
                    <div className="flex items-center gap-3">
                        <Switch checked={s.deductible} onCheckedChange={v => setS(p => ({ ...p, deductible: v }))} />
                        <Label className="text-sm text-muted-foreground">{s.deductible ? "Yes" : "No"}</Label>
                    </div>
                    {!s.deductible && (
                        <div className="mt-2">
                            <Field label="Reason for Non-Deductibility" required error={errors.nonDeductibleReason}>
                                <FormTextarea value={s.nonDeductibleReason} onChange={e => setS(p => ({ ...p, nonDeductibleReason: e.target.value }))} rows={2} placeholder="Explain why this is non-deductible" error={!!errors.nonDeductibleReason} />
                            </Field>
                        </div>
                    )}
                </Field>

                <Field label="VAT Applicable">
                    <div className="flex items-center gap-3">
                        <Switch checked={s.vat} onCheckedChange={v => setS(p => ({ ...p, vat: v }))} />
                        <Label className="text-sm text-muted-foreground">{s.vat ? "Yes (7.5%)" : "No"}</Label>
                    </div>
                    {s.vat && costNum > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Computed VAT: <span className="mono font-medium">{formatNGN(vatPreview)}</span></p>
                    )}
                </Field>

                <Field label="WHT Applicable">
                    <div className="flex items-center gap-3">
                        <Switch checked={s.whtApplicable} onCheckedChange={v => { setS(p => ({ ...p, whtApplicable: v, whtPct: v ? p.whtPct : "" })); }} />
                        <Label className="text-sm text-muted-foreground">{s.whtApplicable ? "Yes" : "No"}</Label>
                    </div>
                    {s.whtApplicable && (
                        <div className="mt-2">
                            <Field label="WHT Rate" required error={errors.whtPct}>
                                <Select value={s.whtPct} onValueChange={v => setS(p => ({ ...p, whtPct: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select rate…" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5%</SelectItem>
                                        <SelectItem value="10">10%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            {costNum > 0 && Number(s.whtPct) > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">Computed WHT: <span className="mono font-medium">{formatNGN(whtPreview)}</span></p>
                            )}
                        </div>
                    )}
                </Field>

                <Field label="COA Account">
                    <Select value={s.coaAccountCode} onValueChange={v => setS(p => ({ ...p, coaAccountCode: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select account (optional)…" /></SelectTrigger>
                        <SelectContent>
                            {EXP_COA.map(a => <SelectItem key={a.code} value={a.code}>{a.code} · {a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">Expense account (6xxx) debited on journal posting.</p>
                </Field>

                <Field label="Remarks">
                    <FormTextarea value={s.remarks} onChange={e => setS(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes" rows={3} />
                </Field>
            </div>
        </SidePanel>
    );
}

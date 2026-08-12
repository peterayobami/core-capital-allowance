import { useState, useEffect, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { SidePanel } from "@/components/shared/SidePanel";
import { Field, FormInput, FormTextarea } from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CUSTOMERS } from "@/lib/mock-data/customer";
import { COA_ACCOUNTS } from "@/lib/mock-data/coa";
import type { RevenueItem } from "@/lib/models/transactions";
import { formatNGN } from "@/lib/utils/format";
import { toast } from "sonner";

const REV_COA = COA_ACCOUNTS.filter(a => a.type === "Revenue" && a.subType !== "Header");
const REV_CATEGORIES = REV_COA.map(a => a.name);

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: (item: RevenueItem) => void;
    initial?: RevenueItem | null;
}

interface FormState {
    description: string;
    invoiceNo: string;
    sales: string;
    date: string;
    customer: string;
    category: string;
    vat: boolean;
    whtApplicable: boolean;
    whtPct: string;
    whtCertificateNo: string;
    coaAccountCode: string;
    remarks: string;
}

const empty = (): FormState => ({
    description: "", invoiceNo: "", sales: "", date: "", customer: "", category: "", vat: false, whtApplicable: false, whtPct: "", whtCertificateNo: "", coaAccountCode: "", remarks: "",
});

export function RevenueFormPanel({ open, onClose, onSaved, initial }: Props) {
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
                sales: initial.sales.toString(),
                date: initial.date.slice(0, 10),
                customer: initial.customer,
                category: initial.category,
                vat: initial.vat,
                whtApplicable: false,
                whtPct: "",
                whtCertificateNo: "",
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
        if (!s.sales || Number(s.sales) <= 0) e.sales = "Amount must be greater than 0.";
        if (!s.customer) e.customer = "Please select a customer.";
        if (!s.date) e.date = "Date is required.";
        if (s.whtApplicable && !s.whtPct) e.whtPct = "Select a WHT rate.";
        return e;
    }, [submitted, s]);

    const salesNum = Number(s.sales) || 0;
    const vatPreview = s.vat ? salesNum * 0.075 : 0;
    const whtPreview = s.whtApplicable ? salesNum * (Number(s.whtPct) / 100) : 0;

    function handleSubmit() {
        setSubmitted(true);
        if (!s.description.trim() || !s.invoiceNo.trim() || !s.sales || Number(s.sales) <= 0 || !s.customer || !s.date) return;
        if (s.whtApplicable && !s.whtPct) return;
        const item: RevenueItem = {
            id: initial?.id ?? `R${Date.now()}`,
            date: s.date,
            invoiceNo: s.invoiceNo.trim(),
            description: s.description.trim(),
            customer: s.customer,
            category: s.category || "Other Income",
            sales: Number(s.sales),
            vat: s.vat,
            coaAccountCode: s.coaAccountCode || undefined,
        };
        onSaved(item);
        toast.success(isEdit ? "Revenue updated" : "Revenue created");
        onClose();
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <SidePanel
            open={open}
            onClose={onClose}
            title={isEdit ? "Edit Revenue" : "New Revenue"}
            icon={<TrendingUp size={18} />}
            iconBg="rgba(16,185,129,0.12)"
            iconColor="var(--cl-success, #10B981)"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Revenue"}</Button>
                </>
            }
        >
            <div className="space-y-5">
                <Field label="Description" required error={errors.description}>
                    <FormInput value={s.description} onChange={e => setS(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Consulting Services" error={!!errors.description} />
                </Field>

                <Field label="Invoice Number" required error={errors.invoiceNo}>
                    <FormInput value={s.invoiceNo} onChange={e => setS(p => ({ ...p, invoiceNo: e.target.value }))} placeholder="INV-OUT-2025-0001" error={!!errors.invoiceNo} />
                </Field>

                <Field label="Sales Amount (₦)" required error={errors.sales}>
                    <FormInput type="number" value={s.sales} onChange={e => setS(p => ({ ...p, sales: e.target.value }))} placeholder="e.g. 2500000" error={!!errors.sales} />
                </Field>

                <Field label="Customer" required error={errors.customer}>
                    <Select value={s.customer} onValueChange={v => setS(p => ({ ...p, customer: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select customer…" /></SelectTrigger>
                        <SelectContent>
                            {CUSTOMERS.map(c => <SelectItem key={c.id} value={c.fullName}>{c.fullName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Revenue Category">
                    <Select value={s.category} onValueChange={v => setS(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select category (optional)…" /></SelectTrigger>
                        <SelectContent>
                            {REV_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Date" required error={errors.date}>
                    <FormInput type="date" value={s.date} max={today} onChange={e => setS(p => ({ ...p, date: e.target.value }))} error={!!errors.date} />
                </Field>

                <Field label="Taxable Supply (VAT)">
                    <div className="flex items-center gap-3">
                        <Switch checked={s.vat} onCheckedChange={v => setS(p => ({ ...p, vat: v }))} />
                        <Label className="text-sm text-muted-foreground">{s.vat ? "Yes (7.5%)" : "No"}</Label>
                    </div>
                    {s.vat && salesNum > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Computed VAT: <span className="mono font-medium">{formatNGN(vatPreview)}</span></p>
                    )}
                </Field>

                <Field label="WHT Applicable">
                    <div className="flex items-center gap-3">
                        <Switch checked={s.whtApplicable} onCheckedChange={v => { setS(p => ({ ...p, whtApplicable: v, whtPct: v ? p.whtPct : "", whtCertificateNo: v ? p.whtCertificateNo : "" })); }} />
                        <Label className="text-sm text-muted-foreground">{s.whtApplicable ? "Yes" : "No"}</Label>
                    </div>
                    {s.whtApplicable && (
                        <div className="mt-2 space-y-3">
                            <Field label="WHT Rate" required error={errors.whtPct}>
                                <Select value={s.whtPct} onValueChange={v => setS(p => ({ ...p, whtPct: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select rate…" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5%</SelectItem>
                                        <SelectItem value="10">10%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            {salesNum > 0 && Number(s.whtPct) > 0 && (
                                <p className="text-xs text-muted-foreground">Computed WHT: <span className="mono font-medium">{formatNGN(whtPreview)}</span></p>
                            )}
                            <Field label="WHT Certificate Number">
                                <FormInput value={s.whtCertificateNo} onChange={e => setS(p => ({ ...p, whtCertificateNo: e.target.value }))} placeholder="WHT-2025-0001" />
                            </Field>
                        </div>
                    )}
                </Field>

                <Field label="COA Account">
                    <Select value={s.coaAccountCode} onValueChange={v => setS(p => ({ ...p, coaAccountCode: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select account (optional)…" /></SelectTrigger>
                        <SelectContent>
                            {REV_COA.map(a => <SelectItem key={a.code} value={a.code}>{a.code} · {a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">Revenue account (4xxx) credited on journal posting.</p>
                </Field>

                <Field label="Remarks">
                    <FormTextarea value={s.remarks} onChange={e => setS(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes" rows={3} />
                </Field>
            </div>
        </SidePanel>
    );
}

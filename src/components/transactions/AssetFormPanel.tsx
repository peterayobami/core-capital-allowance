import { useState, useEffect, useMemo } from "react";
import { Boxes } from "lucide-react";
import { SidePanel } from "@/components/shared/SidePanel";
import { Field, FormInput, FormTextarea } from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { VENDORS } from "@/lib/mock-data/vendor";
import { COA_ACCOUNTS } from "@/lib/mock-data/coa";
import type { AssetItem, AssetClassification } from "@/lib/models/transactions";
import { toast } from "sonner";

const CLASSIFICATIONS: AssetClassification[] = [
    "Office Furniture", "Computer Equipment", "Motor Vehicles",
    "Plant & Machinery", "Office Equipment", "Building",
];

const ASSET_COA = COA_ACCOUNTS.filter(a => a.type === "Asset" && a.subType !== "Header");

interface AssetFormPanelProps {
    open: boolean;
    onClose: () => void;
    onSaved: (item: AssetItem) => void;
    initial?: AssetItem | null;
}

interface FormState {
    description: string;
    cost: string;
    datePurchased: string;
    classification: AssetClassification | "";
    vendor: string;
    coaAccountCode: string;
    remarks: string;
}

const empty = (): FormState => ({
    description: "", cost: "", datePurchased: "", classification: "", vendor: "", coaAccountCode: "", remarks: "",
});

export function AssetFormPanel({ open, onClose, onSaved, initial }: AssetFormPanelProps) {
    const [s, setS] = useState<FormState>(empty());
    const [submitted, setSubmitted] = useState(false);

    const isEdit = !!initial;

    useEffect(() => {
        if (!open) return;
        setSubmitted(false);
        if (initial) {
            setS({
                description: initial.description,
                cost: initial.cost.toString(),
                datePurchased: initial.datePurchased.slice(0, 10),
                classification: initial.classification,
                vendor: "", // not stored in model
                coaAccountCode: initial.coaAccountCode ?? "",
                remarks: initial.remarks ?? "",
            });
        } else {
            setS(empty());
        }
    }, [open, initial]);

    const errors = useMemo(() => {
        if (!submitted) return {} as Record<string, string>;
        const e: Record<string, string> = {};
        if (!s.description.trim()) e.description = "Description is required.";
        if (!s.cost || Number(s.cost) <= 0) e.cost = "Cost must be greater than 0.";
        if (!s.classification) e.classification = "Please select a classification.";
        if (!s.datePurchased) e.datePurchased = "Date is required.";
        return e;
    }, [submitted, s]);

    function handleSubmit() {
        setSubmitted(true);
        if (!s.description.trim() || !s.cost || Number(s.cost) <= 0 || !s.classification || !s.datePurchased) return;
        const item: AssetItem = {
            id: initial?.id ?? `A${Date.now()}`,
            dateCreated: initial?.dateCreated ?? new Date().toISOString(),
            description: s.description.trim(),
            cost: Number(s.cost),
            datePurchased: s.datePurchased,
            classification: s.classification as AssetClassification,
            coaAccountCode: s.coaAccountCode || undefined,
            remarks: s.remarks.trim() || undefined,
        };
        onSaved(item);
        toast.success(isEdit ? "Asset updated" : "Asset created");
        onClose();
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <SidePanel
            open={open}
            onClose={onClose}
            title={isEdit ? "Edit Asset" : "New Asset"}
            icon={<Boxes size={18} />}
            iconBg="rgba(24,79,151,0.12)"
            iconColor="var(--cl-primary)"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Asset"}</Button>
                </>
            }
        >
            <div className="space-y-5">
                <Field label="Description" required error={errors.description}>
                    <FormInput
                        value={s.description}
                        onChange={e => setS(p => ({ ...p, description: e.target.value }))}
                        placeholder="e.g. HP LaserJet Printer"
                        error={!!errors.description}
                    />
                </Field>

                <Field label="Cost (₦)" required error={errors.cost}>
                    <FormInput
                        type="number"
                        value={s.cost}
                        onChange={e => setS(p => ({ ...p, cost: e.target.value }))}
                        placeholder="e.g. 250000"
                        error={!!errors.cost}
                    />
                </Field>

                <Field label="Date Purchased" required error={errors.datePurchased}>
                    <FormInput
                        type="date"
                        value={s.datePurchased}
                        max={today}
                        onChange={e => setS(p => ({ ...p, datePurchased: e.target.value }))}
                        error={!!errors.datePurchased}
                    />
                </Field>

                <Field label="Classification" required error={errors.classification}>
                    <Select value={s.classification} onValueChange={v => setS(p => ({ ...p, classification: v as AssetClassification }))}>
                        <SelectTrigger><SelectValue placeholder="Select classification…" /></SelectTrigger>
                        <SelectContent>
                            {CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Vendor">
                    <Select value={s.vendor} onValueChange={v => setS(p => ({ ...p, vendor: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select vendor (optional)…" /></SelectTrigger>
                        <SelectContent>
                            {VENDORS.map(v => <SelectItem key={v.id} value={v.companyName}>{v.companyName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="COA Account">
                    <Select value={s.coaAccountCode} onValueChange={v => setS(p => ({ ...p, coaAccountCode: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select account (optional)…" /></SelectTrigger>
                        <SelectContent>
                            {ASSET_COA.map(a => <SelectItem key={a.code} value={a.code}>{a.code} · {a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">Non-current Asset account this asset is capitalised to.</p>
                </Field>

                <Field label="Remarks">
                    <FormTextarea
                        value={s.remarks}
                        onChange={e => setS(p => ({ ...p, remarks: e.target.value }))}
                        placeholder="Optional notes about this asset"
                        rows={3}
                    />
                </Field>
            </div>
        </SidePanel>
    );
}

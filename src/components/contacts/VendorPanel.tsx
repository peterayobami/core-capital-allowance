import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/shared/SidePanel";
import { Field, FormInput, FormTextarea } from "@/components/shared/Form";
import { useCreateVendor, useUpdateVendor } from "@/hooks/contacts/use-vendors";
import type { Vendor } from "@/lib/models/vendor";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  vendor?: Vendor; // edit mode if provided
}

const empty = {
  companyName: "", companyEmail: "", companyPhone: "", address: "",
  contactName: "", contactRole: "", contactEmail: "", contactPhone: "",
};

export function VendorPanel({ open, onClose, vendor }: Props) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const create = useCreateVendor();
  const update = useUpdateVendor();
  const saving = create.isPending || update.isPending;
  const isEdit = !!vendor;

  useEffect(() => {
    if (open) {
      setForm(vendor ? {
        companyName: vendor.companyName,
        companyEmail: vendor.companyEmail,
        companyPhone: vendor.companyPhone,
        address: vendor.address,
        contactName: vendor.contact?.fullName ?? "",
        contactRole: vendor.contact?.role ?? "",
        contactEmail: vendor.contact?.email ?? "",
        contactPhone: vendor.contact?.phone ?? "",
      } : empty);
      setErrors({});
      setSubmitted(false);
    }
  }, [open, vendor]);

  const validate = (f: typeof form) => {
    const e: Record<string, string> = {};
    if (!f.companyName.trim()) e.companyName = "Company name is required.";
    if (!f.companyEmail.trim()) e.companyEmail = "Company email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(f.companyEmail)) e.companyEmail = "Enter a valid email.";
    if (!f.companyPhone.trim()) e.companyPhone = "Company phone is required.";
    if (!f.address.trim()) e.address = "Address is required.";
    if (!f.contactName.trim()) e.contactName = "Full name is required.";
    if (!f.contactRole.trim()) e.contactRole = "Role / title is required.";
    if (f.contactEmail && !/^\S+@\S+\.\S+$/.test(f.contactEmail)) e.contactEmail = "Enter a valid email.";
    return e;
  };

  const update_ = (k: keyof typeof form) => (v: string) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

  const onSubmit = async () => {
    setSubmitted(true);
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: Omit<Vendor, "id"> = {
      companyName: form.companyName.trim(),
      companyEmail: form.companyEmail.trim(),
      companyPhone: form.companyPhone.trim(),
      address: form.address.trim(),
      contact: {
        fullName: form.contactName.trim(),
        role: form.contactRole.trim(),
        email: form.contactEmail.trim() || undefined,
        phone: form.contactPhone.trim() || undefined,
      },
    };

    try {
      if (isEdit && vendor) {
        await update.mutateAsync({ id: vendor.id, data: payload });
        toast.success("Vendor updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Vendor created");
      }
      onClose();
    } catch {
      toast.error("Could not save vendor.");
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Vendor" : "New Vendor"}
      description={isEdit ? "Update the vendor details below." : "Fill in the details below to add a new vendor."}
      icon={<Store className="h-5 w-5" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary-deep">
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Company Information</h3>
          <Field label="Company Name" required error={errors.companyName}>
            <FormInput placeholder="e.g. AutoPrime Supplies Ltd" value={form.companyName} onChange={(e) => update_("companyName")(e.target.value)} error={!!errors.companyName} />
          </Field>
          <Field label="Company Email" required error={errors.companyEmail}>
            <FormInput placeholder="e.g. info@autoprime.com" value={form.companyEmail} onChange={(e) => update_("companyEmail")(e.target.value)} error={!!errors.companyEmail} />
          </Field>
          <Field label="Company Phone" required error={errors.companyPhone}>
            <FormInput placeholder="e.g. +234 801 234 5678" value={form.companyPhone} onChange={(e) => update_("companyPhone")(e.target.value)} error={!!errors.companyPhone} />
          </Field>
          <Field label="Address" required error={errors.address}>
            <FormTextarea placeholder="e.g. 14 Adeola Odeku St, Victoria Island, Lagos" value={form.address} onChange={(e) => update_("address")(e.target.value)} error={!!errors.address} />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Contact Person</h3>
          <Field label="Full Name" required error={errors.contactName}>
            <FormInput placeholder="e.g. Cameron Williamson" value={form.contactName} onChange={(e) => update_("contactName")(e.target.value)} error={!!errors.contactName} />
          </Field>
          <Field label="Role / Title" required error={errors.contactRole}>
            <FormInput placeholder="e.g. Sales Representative" value={form.contactRole} onChange={(e) => update_("contactRole")(e.target.value)} error={!!errors.contactRole} />
          </Field>
          <Field label="Contact Email" error={errors.contactEmail}>
            <FormInput placeholder="e.g. cameron@autoprime.com" value={form.contactEmail} onChange={(e) => update_("contactEmail")(e.target.value)} error={!!errors.contactEmail} />
          </Field>
          <Field label="Contact Phone">
            <FormInput placeholder="e.g. +234 801 234 5679" value={form.contactPhone} onChange={(e) => update_("contactPhone")(e.target.value)} />
          </Field>
        </section>
      </div>
    </SidePanel>
  );
}

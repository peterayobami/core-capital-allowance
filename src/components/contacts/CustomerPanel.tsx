import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/shared/SidePanel";
import { Field, FormInput, FormTextarea } from "@/components/shared/Form";
import { CustomerTypeChips } from "@/components/contacts/CustomerTypeChips";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/contacts/use-customers";
import type { Customer, CustomerType } from "@/lib/models/customer";

interface Props { open: boolean; onClose: () => void; customer?: Customer; }

const empty = { fullName: "", email: "", phone: "", address: "", type: undefined as CustomerType | undefined };

export function CustomerPanel({ open, onClose, customer }: Props) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const saving = create.isPending || update.isPending;
  const isEdit = !!customer;

  useEffect(() => {
    if (open) {
      setForm(customer
        ? { fullName: customer.fullName, email: customer.email, phone: customer.phone, address: customer.address, type: customer.type }
        : empty);
      setErrors({});
      setSubmitted(false);
    }
  }, [open, customer]);

  const validate = (f: typeof form) => {
    const e: Record<string, string> = {};
    if (!f.fullName.trim()) e.fullName = "Full name is required.";
    if (!f.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email.";
    if (!f.phone.trim()) e.phone = "Phone is required.";
    if (!f.address.trim()) e.address = "Address is required.";
    if (!f.type) e.type = "Please select a customer type.";
    return e;
  };

  const upd = (k: keyof typeof form) => (v: any) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

  const onSubmit = async () => {
    setSubmitted(true);
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      type: form.type!,
    };
    try {
      if (isEdit && customer) {
        await update.mutateAsync({ id: customer.id, data: payload });
        toast.success("Customer updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Customer created");
      }
      onClose();
    } catch {
      toast.error("Could not save customer.");
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Customer" : "New Customer"}
      description={isEdit ? "Update the customer details below." : "Fill in the details below to add a new customer."}
      icon={<UserPlus className="h-5 w-5" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary-deep">
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Full Name" required error={errors.fullName}>
          <FormInput placeholder="e.g. Acme Corporation" value={form.fullName} onChange={(e) => upd("fullName")(e.target.value)} error={!!errors.fullName} />
        </Field>
        <Field label="Email Address" required error={errors.email}>
          <FormInput placeholder="e.g. hello@acme.com" value={form.email} onChange={(e) => upd("email")(e.target.value)} error={!!errors.email} />
        </Field>
        <Field label="Phone Number" required error={errors.phone}>
          <FormInput placeholder="e.g. +234 801 234 5678" value={form.phone} onChange={(e) => upd("phone")(e.target.value)} error={!!errors.phone} />
        </Field>
        <Field label="Address" required error={errors.address}>
          <FormTextarea placeholder="e.g. 12 Marina Street, Lagos" value={form.address} onChange={(e) => upd("address")(e.target.value)} error={!!errors.address} />
        </Field>
        <CustomerTypeChips value={form.type} onChange={(v) => upd("type")(v)} error={errors.type} />
      </div>
    </SidePanel>
  );
}

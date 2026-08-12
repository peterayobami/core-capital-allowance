import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/shared/SidePanel";
import { Field, FormInput } from "@/components/shared/Form";
import { useCreateHrEmployee, useUpdateHrEmployee } from "@/hooks/contacts/use-hr-employees";
import type { HrEmployee } from "@/lib/models/employee";

interface Props { open: boolean; onClose: () => void; employee?: HrEmployee; }

const empty = { firstName: "", lastName: "", department: "", title: "", email: "", phone: "" };

export function EmployeePanel({ open, onClose, employee }: Props) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const create = useCreateHrEmployee();
  const update = useUpdateHrEmployee();
  const saving = create.isPending || update.isPending;
  const isEdit = !!employee;

  useEffect(() => {
    if (open) {
      setForm(employee
        ? { firstName: employee.firstName, lastName: employee.lastName, department: employee.department, title: employee.title ?? "", email: employee.email, phone: employee.phone }
        : empty);
      setErrors({});
      setSubmitted(false);
    }
  }, [open, employee]);

  const validate = (f: typeof form) => {
    const e: Record<string, string> = {};
    if (!f.firstName.trim()) e.firstName = "First name is required.";
    if (!f.lastName.trim()) e.lastName = "Last name is required.";
    if (!f.department.trim()) e.department = "Department is required.";
    if (!f.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email.";
    if (!f.phone.trim()) e.phone = "Phone is required.";
    return e;
  };

  const upd = (k: keyof typeof form) => (v: string) => {
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
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      department: form.department.trim(),
      title: form.title.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim(),
    };
    try {
      if (isEdit && employee) {
        await update.mutateAsync({ id: employee.id, data: payload });
        toast.success("Employee updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Employee added");
      }
      onClose();
    } catch {
      toast.error("Could not save employee.");
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Employee" : "New Employee"}
      description={isEdit ? "Update the employee details below." : "Fill in the details below to add a new team member."}
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" required error={errors.firstName}>
            <FormInput value={form.firstName} onChange={(e) => upd("firstName")(e.target.value)} placeholder="e.g. Aisha" error={!!errors.firstName} />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <FormInput value={form.lastName} onChange={(e) => upd("lastName")(e.target.value)} placeholder="e.g. Nwosu" error={!!errors.lastName} />
          </Field>
        </div>
        <Field label="Department" required error={errors.department}>
          <FormInput value={form.department} onChange={(e) => upd("department")(e.target.value)} placeholder="e.g. Marketing" error={!!errors.department} />
        </Field>
        <Field label="Job Title">
          <FormInput value={form.title} onChange={(e) => upd("title")(e.target.value)} placeholder="e.g. Marketing Manager" />
        </Field>
        <Field label="Email" required error={errors.email}>
          <FormInput value={form.email} onChange={(e) => upd("email")(e.target.value)} placeholder="e.g. a.nwosu@company.com" error={!!errors.email} />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <FormInput value={form.phone} onChange={(e) => upd("phone")(e.target.value)} placeholder="e.g. +234 706 678 9012" error={!!errors.phone} />
        </Field>
      </div>
    </SidePanel>
  );
}

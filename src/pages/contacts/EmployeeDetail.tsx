import { useParams } from "react-router-dom";
import { useState } from "react";
import { Mail, Phone, BadgeCheck, Briefcase } from "lucide-react";
import { ContactsLayout } from "@/components/contacts/ContactsLayout";
import { ClCard, ClCardHeader } from "@/components/shared/ClCard";
import { Button } from "@/components/ui/button";
import { ColoredAvatar } from "@/components/shared/Avatar";
import { useHrEmployee } from "@/hooks/contacts/use-hr-employees";
import { EmployeePanel } from "@/components/contacts/EmployeePanel";
import { fullName } from "@/lib/models/employee";
import { ShimmerBox } from "@/components/shared/Shimmer";

export default function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const { data: employee, isLoading } = useHrEmployee(id);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <ContactsLayout title="Employee Profile">
      {isLoading ? (
        <ShimmerBox height={400} />
      ) : !employee ? (
        <div className="py-24 text-center text-muted-foreground">Employee not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 pt-4">
          <div className="space-y-6 min-w-0">
            <section className="cl-card p-6">
              <h2 className="text-base font-semibold mb-4">Profile</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Info label="Full Name" value={fullName(employee)} />
                <Info label="Staff ID" value={employee.id} mono />
                <Info label="Department" value={employee.department} />
                <Info label="Job Title" value={employee.title ?? "—"} />
                <Info label="Email" value={employee.email} />
                <Info label="Phone" value={employee.phone} />
              </dl>
            </section>

            <section className="cl-card p-6">
              <h2 className="text-base font-semibold mb-2">Payroll Setup</h2>
              <p className="text-xs text-muted-foreground">
                Configure this employee's PAYE income structure, statutory deductions and rent relief in the Payroll module under <span className="text-primary">Taxation → Payroll → Employee Setup</span>.
              </p>
              <div className="mt-4">
                <a href="/taxation/paye/employees" className="inline-block">
                  <Button variant="outline">Open Employee Setup</Button>
                </a>
              </div>
            </section>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <ClCard>
              <ClCardHeader>Employee</ClCardHeader>
              <div className="flex items-start gap-3">
                <ColoredAvatar name={fullName(employee)} size={44} />
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{fullName(employee)}</div>
                  <div className="text-xs text-muted-foreground">{employee.department}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                {employee.title && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" /><span>{employee.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="h-3.5 w-3.5" /><span className="font-mono">{employee.id}</span>
                </div>
              </div>
            </ClCard>

            <ClCard>
              <ClCardHeader>Contact</ClCardHeader>
              <div className="space-y-1.5 text-xs text-primary">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span>{employee.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{employee.phone}</span></div>
              </div>
            </ClCard>

            <ClCard>
              <ClCardHeader>Quick Actions</ClCardHeader>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-deep" onClick={() => setEditOpen(true)}>
                Edit Employee
              </Button>
              <a href="/taxation/paye/employees" className="block">
                <Button variant="outline" className="w-full mt-2">Configure Payroll</Button>
              </a>
            </ClCard>
          </div>
        </div>
      )}

      <EmployeePanel open={editOpen} onClose={() => setEditOpen(false)} employee={employee ?? undefined} />
    </ContactsLayout>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

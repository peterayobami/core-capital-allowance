import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactsLayout } from "@/components/contacts/ContactsLayout";
import { SearchInput } from "@/components/shared/SearchInput";
import { LinearProgress } from "@/components/shared/Shimmer";
import { EmployeeCard, EmployeeCardShimmer } from "@/components/contacts/EmployeeCard";
import { EmployeePanel } from "@/components/contacts/EmployeePanel";
import { useHrEmployees } from "@/hooks/contacts/use-hr-employees";

export default function EmployeesPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isLoading, isFetching } = useHrEmployees();

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(e =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
      e.department.toLowerCase().includes(s) ||
      e.id.toLowerCase().includes(s) ||
      e.email.toLowerCase().includes(s),
    );
  }, [data, q]);

  return (
    <ContactsLayout title="Employees">
      <div className="pt-2 pb-4 sticky top-14 z-10 bg-background">
        <div className="flex items-center gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search employees" className="w-[320px] max-w-full" />
          <div className="ml-auto">
            <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary-deep">
              <Plus className="h-4 w-4 mr-1.5" /> New Employee
            </Button>
          </div>
        </div>
        <LinearProgress active={!isLoading && isFetching} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <EmployeeCardShimmer key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-[88px] w-[88px] rounded-full bg-muted grid place-items-center text-muted-foreground">
            <Users className="h-9 w-9" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">{q ? "No employees match your search" : "No employees yet"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{q ? "Try a different search term." : "Team members you add will show up here."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(e => <EmployeeCard key={e.id} employee={e} />)}
        </div>
      )}

      <EmployeePanel open={open} onClose={() => setOpen(false)} />
    </ContactsLayout>
  );
}

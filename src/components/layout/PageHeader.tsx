import { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Bell, HelpCircle, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header
      className="sticky top-0 z-20 h-14 bg-background/95 backdrop-blur flex items-center px-6 shrink-0"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <button onClick={() => navigate(-1)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => navigate(1)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <h1 className="ml-3 text-[17px] font-semibold text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
        {right}
        <button className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted">
          <Bell className="h-4 w-4" />
        </button>
        <button className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted">
          <Inbox className="h-4 w-4" />
        </button>
        <button className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted">
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

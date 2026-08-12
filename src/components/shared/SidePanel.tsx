import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function SidePanel({
  open, onClose, title, description, icon, iconBg = "#FEF3C7", iconColor = "#FFC107",
  children, footer,
}: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 animate-in fade-in"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card flex flex-col",
          "animate-in slide-in-from-right duration-200",
        )}
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        <header className="flex items-start gap-3 px-6 py-5 border-b border-border shrink-0">
          {icon && (
            <div
              className="h-10 w-10 rounded-full grid place-items-center shrink-0"
              style={{ background: iconBg, color: iconColor }}
            >
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="px-6 py-4 border-t border-border bg-card shrink-0 flex justify-end gap-2">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}

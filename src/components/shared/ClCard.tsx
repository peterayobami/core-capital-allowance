import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps { className?: string; children: ReactNode }

export function ClCard({ className, children }: CardProps) {
  return <div className={cn("cl-card p-4", className)}>{children}</div>;
}

export function ClCardHeader({ children }: { children: ReactNode }) {
  return <div className="text-sm font-semibold text-foreground mb-3">{children}</div>;
}

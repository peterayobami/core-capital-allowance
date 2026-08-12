import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function FormInput({
  className, error, ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      {...rest}
      className={cn(
        "w-full h-11 px-3 rounded-md bg-input text-sm text-foreground placeholder:text-[#9D9D9D]",
        "border focus:outline-none transition-colors",
        error
          ? "border-danger"
          : "border-transparent focus:border-[1.2px] focus:border-primary focus:bg-card",
        className,
      )}
    />
  );
}

export function FormTextarea({
  className, error, ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      {...rest}
      className={cn(
        "w-full min-h-[72px] px-3 py-2.5 rounded-md bg-input text-sm text-foreground placeholder:text-[#9D9D9D]",
        "border focus:outline-none transition-colors resize-y",
        error
          ? "border-danger"
          : "border-transparent focus:border-[1.2px] focus:border-primary focus:bg-card",
        className,
      )}
    />
  );
}

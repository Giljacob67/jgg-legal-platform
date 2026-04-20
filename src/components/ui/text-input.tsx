import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  error?: string;
  requiredMark?: boolean;
};

export function TextInput({
  label,
  helperText,
  error,
  className,
  requiredMark = false,
  ...props
}: TextInputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="flex items-center gap-1 text-sm font-semibold text-[var(--color-ink)]">
        {label}
        {requiredMark ? <span className="text-[var(--color-accent)]">*</span> : null}
      </span>
      <input
        className={cn(
          "rounded-2xl border bg-[var(--color-card-strong)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white",
          error ? "border-[var(--color-warning-border)]" : "border-[var(--color-border)]",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-[var(--color-warning-ink)]">{error}</span> : null}
      {!error && helperText ? <span className="text-xs leading-5 text-[var(--color-muted)]">{helperText}</span> : null}
    </label>
  );
}

import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type OptionGroup = {
  label: string;
  options: Option[];
};

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  helperText?: string;
  error?: string;
  requiredMark?: boolean;
  /** Flat list of options (use this OR groups, not both). */
  options?: Option[];
  /** Grouped options rendered as <optgroup> (use this OR options, not both). */
  groups?: OptionGroup[];
};

export function SelectInput({
  label,
  helperText,
  error,
  options,
  groups,
  className,
  requiredMark = false,
  ...props
}: SelectInputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="flex items-center gap-1 text-sm font-semibold text-[var(--color-ink)]">
        {label}
        {requiredMark ? <span className="text-[var(--color-accent)]">*</span> : null}
      </span>
      <select
        className={cn(
          "rounded-2xl border bg-[var(--color-card-strong)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:bg-white",
          error ? "border-[var(--color-warning-border)]" : "border-[var(--color-border)]",
          className,
        )}
        {...props}
      >
        {groups
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
      </select>
      {error ? <span className="text-xs font-medium text-[var(--color-warning-ink)]">{error}</span> : null}
      {!error && helperText ? <span className="text-xs leading-5 text-[var(--color-muted)]">{helperText}</span> : null}
    </label>
  );
}

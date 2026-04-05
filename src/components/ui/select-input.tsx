import type { SelectHTMLAttributes } from "react";

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
  /** Flat list of options (use this OR groups, not both). */
  options?: Option[];
  /** Grouped options rendered as <optgroup> (use this OR options, not both). */
  groups?: OptionGroup[];
};

export function SelectInput({ label, options, groups, ...props }: SelectInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--color-ink)]">{label}</span>
      <select
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-accent)]"
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
    </label>
  );
}

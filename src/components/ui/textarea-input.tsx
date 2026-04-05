import type { TextareaHTMLAttributes } from "react";

type TextareaInputProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextareaInput({ label, ...props }: TextareaInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--color-ink)]">{label}</span>
      <textarea
        className="min-h-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-accent)]"
        {...props}
      />
    </label>
  );
}

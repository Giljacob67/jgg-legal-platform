import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--color-border-subtle)] pb-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted-strong)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-[1.4rem] leading-tight text-[var(--color-ink)]">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

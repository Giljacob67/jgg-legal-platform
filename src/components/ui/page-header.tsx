import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  eyebrow = "Operação Jurídica",
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-6 shadow-[var(--shadow-card)]", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted-strong)]">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-[var(--color-ink)] md:text-[2.3rem]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)] md:text-[15px]">{description}</p>
          {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

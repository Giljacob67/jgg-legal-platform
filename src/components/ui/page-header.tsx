import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}

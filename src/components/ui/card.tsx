import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
};

export function Card({ title, subtitle, className, children }: CardProps) {
  return (
    <section className={cn("rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm", className)}>
      {title ? <h3 className="font-serif text-lg text-[var(--color-ink)]">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p> : null}
      <div className={cn(title || subtitle ? "mt-4" : "", "space-y-3")}>{children}</div>
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";

type CardProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  eyebrow?: string;
};

export function Card({ title, subtitle, className, children, headerActions, eyebrow }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {title ? (
        <SectionHeader
          title={title}
          description={subtitle}
          eyebrow={eyebrow}
          actions={headerActions}
          className="pb-5"
        />
      ) : null}
      <div className={cn(title ? "pt-5" : "", "space-y-4")}>{children}</div>
    </section>
  );
}

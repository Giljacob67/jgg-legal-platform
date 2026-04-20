import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  label: string;
  variant?: "primario" | "secundario";
  icon?: ReactNode;
  className?: string;
};

export function ButtonLink({ href, label, variant = "primario", icon, className }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
        variant === "primario"
          ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)]"
          : "border border-[var(--color-border)] bg-[var(--color-card-strong)] text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]",
        className,
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

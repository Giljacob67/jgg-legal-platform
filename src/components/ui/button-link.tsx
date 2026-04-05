import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  label: string;
  variant?: "primario" | "secundario";
};

export function ButtonLink({ href, label, variant = "primario" }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition",
        variant === "primario"
          ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)]"
          : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]",
      )}
    >
      {label}
    </Link>
  );
}

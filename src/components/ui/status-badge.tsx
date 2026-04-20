import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  variant?: "ativo" | "implantacao" | "planejado" | "sucesso" | "alerta" | "neutro" | "mock";
};

const variantClass: Record<NonNullable<StatusBadgeProps["variant"]>, string> = {
  ativo: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-ink)]",
  implantacao: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)]",
  planejado: "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-muted-strong)]",
  sucesso: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-ink)]",
  alerta: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)]",
  neutro: "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-muted-strong)]",
  mock: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-ink)]",
};

export function StatusBadge({ label, variant = "neutro" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        variantClass[variant],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

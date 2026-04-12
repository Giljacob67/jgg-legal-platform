import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  variant?: "ativo" | "implantacao" | "planejado" | "sucesso" | "alerta" | "neutro" | "mock";
};

const variantClass: Record<NonNullable<StatusBadgeProps["variant"]>, string> = {
  ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  implantacao: "bg-amber-50 text-amber-700 border-amber-200",
  planejado: "bg-slate-100 text-slate-700 border-slate-200",
  sucesso: "bg-emerald-50 text-emerald-700 border-emerald-200",
  alerta: "bg-rose-50 text-rose-700 border-rose-200",
  neutro: "bg-slate-100 text-slate-700 border-slate-200",
  mock: "bg-purple-50 text-purple-700 border-purple-200",
};

export function StatusBadge({ label, variant = "neutro" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        variantClass[variant],
      )}
    >
      {label}
    </span>
  );
}

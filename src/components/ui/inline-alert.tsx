import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangleIcon, ShieldCheckIcon, SparkIcon } from "@/components/ui/icons";

type InlineAlertProps = {
  title: string;
  children: ReactNode;
  variant?: "info" | "warning" | "success";
  className?: string;
};

const toneByVariant = {
  info: {
    wrapper: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-ink)]",
    icon: SparkIcon,
  },
  warning: {
    wrapper: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)]",
    icon: AlertTriangleIcon,
  },
  success: {
    wrapper: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-ink)]",
    icon: ShieldCheckIcon,
  },
} as const;

export function InlineAlert({
  title,
  children,
  variant = "info",
  className,
}: InlineAlertProps) {
  const tone = toneByVariant[variant];
  const Icon = tone.icon;

  return (
    <div className={cn("flex gap-3 rounded-2xl border px-4 py-3.5", tone.wrapper, className)}>
      <div className="mt-0.5 rounded-full bg-white/60 p-2">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-6 opacity-90">{children}</div>
      </div>
    </div>
  );
}

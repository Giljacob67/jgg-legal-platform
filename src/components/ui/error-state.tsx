import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangleIcon } from "@/components/ui/icons";

export function ErrorState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-4 rounded-[1.35rem] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-5 py-4 text-[var(--color-warning-ink)]">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/55">
          <AlertTriangleIcon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Não foi possível carregar os dados</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{message}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </Card>
  );
}

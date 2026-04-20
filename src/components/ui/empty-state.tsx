import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { FileIcon, SparkIcon } from "@/components/ui/icons";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <Card className="overflow-hidden">
      <div className="rounded-[1.4rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-alt)] px-6 py-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-strong)] text-[var(--color-accent)] shadow-sm">
          {icon ?? (
            <span className="relative">
              <FileIcon size={22} />
              <SparkIcon size={12} className="absolute -right-1 -top-1" />
            </span>
          )}
        </div>
        <p className="mt-5 font-serif text-2xl text-[var(--color-ink)]">{title}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">{message}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  );
}

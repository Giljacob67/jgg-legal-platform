import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type StatCardProps = {
  label: string;
  value: string;
  trend?: string;
};

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <Card className="h-full">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="font-serif text-4xl text-[var(--color-ink)]">{value}</p>
        {trend ? <StatusBadge label={trend} variant="neutro" /> : null}
      </div>
    </Card>
  );
}

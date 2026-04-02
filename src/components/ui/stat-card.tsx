import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  trend?: string;
};

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="font-serif text-3xl text-[var(--color-ink)]">{value}</p>
      {trend ? <p className="text-xs text-[var(--color-muted)]">{trend}</p> : null}
    </Card>
  );
}

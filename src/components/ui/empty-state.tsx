import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <Card>
      <p className="font-semibold text-[var(--color-ink)]">{title}</p>
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
    </Card>
  );
}

import { Card } from "@/components/ui/card";

export function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <p className="font-semibold text-rose-700">Não foi possível carregar os dados</p>
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
    </Card>
  );
}

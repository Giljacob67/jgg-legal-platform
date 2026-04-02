import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export function PlaceholderModuloPage({
  nome,
  status,
  descricao,
}: {
  nome: string;
  status: "em implantação" | "planejado";
  descricao: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={nome} description={descricao} />
      <Card>
        <div className="flex items-center gap-3">
          <StatusBadge label={status} variant={status === "em implantação" ? "implantacao" : "planejado"} />
          <p className="text-sm text-[var(--color-muted)]">
            Este módulo já está preparado na arquitetura do HUB e será evoluído nas próximas fases.
          </p>
        </div>
      </Card>
    </div>
  );
}

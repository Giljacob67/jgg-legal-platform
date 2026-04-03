import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListaContratos } from "@/modules/contratos/ui/lista-contratos";
import { listarContratos } from "@/modules/contratos/application";
import { LABEL_STATUS_CONTRATO } from "@/modules/contratos/domain/types";
import Link from "next/link";

export default async function ContratosPage() {
  const contratos = await listarContratos();

  const porStatus = contratos.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Contratos"
          description={`${contratos.length} contratos · Fluxo contratual com análise de risco por IA.`}
        />
        <Link
          href="/contratos/novo"
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
        >
          + Novo contrato
        </Link>
      </div>

      {/* KPIs por status */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {(["vigente", "em_revisao", "rascunho", "assinado"] as const).map((status) => (
          <div key={status} className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-ink)]">{porStatus[status] ?? 0}</p>
            <p className="text-xs font-medium text-[var(--color-muted)]">{LABEL_STATUS_CONTRATO[status]}</p>
          </div>
        ))}
      </div>

      <Card title="Todos os contratos" subtitle="Ordenados por atualização mais recente.">
        <ListaContratos contratos={contratos} />
      </Card>
    </div>
  );
}

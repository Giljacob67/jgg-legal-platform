import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ListaContratos } from "@/modules/contratos/ui/lista-contratos";
import { listarContratos } from "@/modules/contratos/application";
import { LABEL_STATUS_CONTRATO } from "@/modules/contratos/domain/types";
import { FilePlusIcon } from "@/components/ui/icons";

export default async function ContratosPage() {
  const contratos = await listarContratos();

  const porStatus = contratos.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description={`${contratos.length} contratos · Fluxo contratual com análise de risco por IA.`}
        meta={<StatusBadge label={`${porStatus.vigente ?? 0} vigentes`} variant="sucesso" />}
        actions={<ButtonLink href="/contratos/novo" label="Novo contrato" icon={<FilePlusIcon size={16} />} />}
      />

      {/* KPIs por status */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {(["vigente", "em_revisao", "rascunho", "assinado"] as const).map((status) => (
          <div key={status} className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-center shadow-[var(--shadow-card)]">
            <p className="font-serif text-4xl text-[var(--color-ink)]">{porStatus[status] ?? 0}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">{LABEL_STATUS_CONTRATO[status]}</p>
          </div>
        ))}
      </div>

      <Card title="Todos os contratos" subtitle="Ordenados por atualização mais recente." eyebrow="Esteira contratual">
        <ListaContratos contratos={contratos} />
      </Card>
    </div>
  );
}

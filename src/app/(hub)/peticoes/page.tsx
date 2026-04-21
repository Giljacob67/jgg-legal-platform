import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LibraryIcon, ScaleIcon } from "@/components/ui/icons";
import { listarPedidosDePeca } from "@/modules/peticoes/application/listarPedidosDePeca";
import { listarAlertasGovernancaPorResponsavel } from "@/modules/peticoes/application/listarAlertasGovernancaPorResponsavel";
import { GovernancaResponsaveisBoard } from "@/modules/peticoes/ui/governanca-responsaveis-board";
import { PedidosOperacionaisList } from "@/modules/peticoes/ui/pedidos-operacionais-list";

export default async function PeticoesPage() {
  const pedidos = await listarPedidosDePeca();
  const resumoGovernanca = listarAlertasGovernancaPorResponsavel(pedidos);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Petições"
        description="Centro de produção jurídica com pipeline, auditoria e editor de minuta."
        meta={<StatusBadge label={`${pedidos.length} pedidos ativos`} variant="ativo" />}
        actions={
          <>
            <ButtonLink href="/peticoes/novo" label="Novo pedido de peça" icon={<ScaleIcon size={16} />} />
            <ButtonLink
              href="/peticoes/base-juridica"
              label="Base jurídica viva"
              icon={<LibraryIcon size={16} />}
              variant="secundario"
            />
          </>
        }
      />

      <Card
        title="Fluxo de produção jurídica"
        subtitle="A fila operacional agora centraliza busca, priorização de prazo e roteamento por responsável."
        eyebrow="Workbench"
      >
        <p className="text-sm text-[var(--color-muted)]">
          Use os filtros para distribuir carga de trabalho, atacar urgências e reduzir tempo de ciclo entre triagem,
          produção, revisão e aprovação.
        </p>
      </Card>

      <GovernancaResponsaveisBoard resumo={resumoGovernanca} />

      <PedidosOperacionaisList pedidos={pedidos} />
    </div>
  );
}

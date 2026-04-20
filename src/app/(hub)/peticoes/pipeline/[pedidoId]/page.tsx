import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileIcon } from "@/components/ui/icons";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterMinutaPorPedidoId } from "@/modules/peticoes/application/obterMinutaPorPedidoId";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { PipelineWorkspace } from "@/modules/peticoes/ui/pipeline-workspace";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";

type PipelinePedidoPageProps = {
  params: Promise<{ pedidoId: string }>;
};

export default async function PipelinePedidoPage({ params }: PipelinePedidoPageProps) {
  const { pedidoId } = await params;

  const [pedido, session, minuta] = await Promise.all([
    obterPedidoDePeca(pedidoId),
    auth(),
    obterMinutaPorPedidoId(pedidoId),
  ]);

  if (!pedido) {
    notFound();
  }

  const { etapas, historico, snapshots, etapaAtual, contextoAtual } = await obterPipelineDoPedido(pedido.id);

  const perfilUsuario = resolverPerfilUsuario(session?.user?.role as string | undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline da Peça"
        description={`${pedido.id} • ${pedido.titulo}`}
        meta={
          <>
            <StatusBadge label={pedido.status} variant={pedido.status === "aprovado" ? "sucesso" : "implantacao"} />
            <StatusBadge label={`etapa ${etapaAtual.replaceAll("_", " ")}`} variant="neutro" />
          </>
        }
        actions={
          minuta ? (
            <ButtonLink
              href={`/peticoes/minutas/${minuta.id}/editor`}
              label="Abrir editor"
              icon={<FileIcon size={16} />}
              variant="secundario"
            />
          ) : undefined
        }
      />
      <PipelineWorkspace
        pedidoId={pedido.id}
        etapas={etapas}
        etapaInicial={etapaAtual}
        historico={historico}
        snapshots={snapshots}
        contextoAtual={contextoAtual}
        perfilUsuario={perfilUsuario}
      />
    </div>
  );
}

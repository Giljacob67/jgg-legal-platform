import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { PipelineWorkspace } from "@/modules/peticoes/ui/pipeline-workspace";

type PipelinePedidoPageProps = {
  params: Promise<{ pedidoId: string }>;
};

export default async function PipelinePedidoPage({ params }: PipelinePedidoPageProps) {
  const { pedidoId } = await params;
  const pedido = obterPedidoDePeca(pedidoId);

  if (!pedido) {
    notFound();
  }

  const { etapas, historico } = obterPipelineDoPedido(pedido.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline da Peça"
        description={`${pedido.id} • ${pedido.titulo}`}
      />
      <PipelineWorkspace etapas={etapas} etapaInicial={pedido.etapaAtual} historico={historico} />
    </div>
  );
}

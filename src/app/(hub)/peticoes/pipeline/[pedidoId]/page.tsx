import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { PipelineWorkspace } from "@/modules/peticoes/ui/pipeline-workspace";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";

type PipelinePedidoPageProps = {
  params: Promise<{ pedidoId: string }>;
};

export default async function PipelinePedidoPage({ params }: PipelinePedidoPageProps) {
  const { pedidoId } = await params;

  const [pedido, session] = await Promise.all([
    obterPedidoDePeca(pedidoId),
    auth(),
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterMinutaPorPedidoId } from "@/modules/peticoes/application/obterMinutaPorPedidoId";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { listarDocumentosPorPedido } from "@/modules/documentos/application/listarDocumentosPorPedido";
import { listarDocumentosPorCaso } from "@/modules/documentos/application/listarDocumentosPorCaso";
import { DocumentoUploadPanel } from "@/modules/documentos/ui/documento-upload-panel";
import { formatarData } from "@/lib/utils";

type PedidoDetalhePageProps = {
  params: Promise<{ pedidoId: string }>;
};

export default async function PedidoDetalhePage({ params }: PedidoDetalhePageProps) {
  const { pedidoId } = await params;
  const pedido = obterPedidoDePeca(pedidoId);

  if (!pedido) {
    notFound();
  }

  const minuta = obterMinutaPorPedidoId(pedido.id);
  const pipelineOperacional = await obterPipelineDoPedido(pedido.id).catch(() => null);
  const documentosDoPedido = await listarDocumentosPorPedido(pedido.id);
  const documentos =
    documentosDoPedido.length > 0 ? documentosDoPedido : await listarDocumentosPorCaso(pedido.casoId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pedido.titulo}
        description={`Pedido ${pedido.id} vinculado ao caso ${pedido.casoId}`}
        actions={<StatusBadge label={pedido.status} variant="implantacao" />}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <Card title="Resumo do pedido">
          <div className="grid gap-2 text-sm text-[var(--color-ink)]">
            <p>
              <strong>Tipo de peça:</strong> {pedido.tipoPeca}
            </p>
            <p>
              <strong>Prioridade:</strong> {pedido.prioridade}
            </p>
            <p>
              <strong>Etapa atual:</strong> {(pipelineOperacional?.etapaAtual ?? pedido.etapaAtual).replaceAll("_", " ")}
            </p>
            <p>
              <strong>Responsável:</strong> {pedido.responsavel}
            </p>
            <p>
              <strong>Prazo final:</strong> {formatarData(pedido.prazoFinal)}
            </p>
          </div>
        </Card>

        <Card title="Ações rápidas">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/peticoes/pipeline/${pedido.id}`}
              className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-surface-alt)]"
            >
              Abrir pipeline
            </Link>
            {minuta ? (
              <Link
                href={`/peticoes/minutas/${minuta.id}/editor`}
                className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-surface-alt)]"
              >
                Abrir editor de minuta
              </Link>
            ) : null}
          </div>
        </Card>
      </section>

      <DocumentoUploadPanel
        titulo="Adicionar documento ao pedido"
        descricao="Upload real com persistência e vínculo direto ao caso e ao pedido."
        fixedVinculos={[
          { tipoEntidade: "caso", entidadeId: pedido.casoId, papel: "principal" },
          { tipoEntidade: "pedido_peca", entidadeId: pedido.id, papel: "apoio" },
        ]}
        mostrarSeletores={false}
      />

      <Card title="Documentos utilizados">
        <div className="grid gap-3 md:grid-cols-2">
          {documentos.map((documento) => (
            <article key={documento.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="font-semibold text-[var(--color-ink)]">{documento.titulo}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {documento.tipo} • {documento.status}
              </p>
              <p className="text-xs text-[var(--color-muted)]">Processamento: {documento.statusProcessamento}</p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

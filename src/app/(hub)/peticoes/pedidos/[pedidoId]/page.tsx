import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { avaliarProntidaoAprovacao } from "@/modules/peticoes/application/avaliarProntidaoAprovacao";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterMinutaPorPedidoId } from "@/modules/peticoes/application/obterMinutaPorPedidoId";
import { obterEditorMinutaOperacional } from "@/modules/peticoes/application/operacional/obterEditorMinutaOperacional";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import {
  calcularDiasRestantesPrazo,
  responsavelObrigatorioAtendido,
} from "@/modules/peticoes/application/governanca-pedido";
import { listarDocumentosPorPedido } from "@/modules/documentos/application/listarDocumentosPorPedido";
import { listarDocumentosPorCaso } from "@/modules/documentos/application/listarDocumentosPorCaso";
import { DocumentoUploadPanel } from "@/modules/documentos/ui/documento-upload-panel";
import { AtribuirResponsavelCard } from "@/modules/peticoes/ui/atribuir-responsavel-card";
import { PedidoWorkspaceClient } from "@/modules/peticoes/ui/pedido-workspace/pedido-workspace-client";
import { getDataMode } from "@/lib/data-mode";
import type { EtapaPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";

type PedidoDetalhePageProps = {
  params: Promise<{ pedidoId: string }>;
};

function consolidarUltimoSnapshotPorEtapa(snapshots: SnapshotPipelineEtapa[]) {
  const mapa = new Map<EtapaPipeline, SnapshotPipelineEtapa>();
  for (const snapshot of snapshots) {
    if (!mapa.has(snapshot.etapa)) {
      mapa.set(snapshot.etapa, snapshot);
    }
  }
  return mapa;
}

interface ProximaAcaoRecomendada {
  titulo: string;
  descricao: string;
  href: string;
  label: string;
}

function definirProximaAcaoRecomendada(input: {
  pedidoId: string;
  responsavelDefinido: boolean;
  contextoAtual: import("@/modules/peticoes/domain/types").ContextoJuridicoPedido | null;
  minutaId?: string;
  prontidaoAprovacao?: import("@/modules/peticoes/application/avaliarProntidaoAprovacao").ProntidaoAprovacao;
  pedidoStatus: import("@/modules/peticoes/domain/types").StatusPedido;
}): ProximaAcaoRecomendada {
  const { pedidoId, responsavelDefinido, contextoAtual, minutaId, prontidaoAprovacao, pedidoStatus } = input;

  if (!responsavelDefinido) {
    return {
      titulo: "Definir responsável titular",
      descricao: "O fluxo operacional continua bloqueado até existir um responsável formal pelo pedido.",
      href: "#responsavel",
      label: "Atribuir responsável",
    };
  }

  if (!contextoAtual) {
    return {
      titulo: "Consolidar contexto jurídico",
      descricao: "Ainda faltam fatos, cronologia e estratégia base para iniciar uma redação confiável.",
      href: `/peticoes/pipeline/${pedidoId}`,
      label: "Abrir pipeline",
    };
  }

  if (contextoAtual.validacaoHumanaTesesPendente) {
    return {
      titulo: "Validar teses antes da peça final",
      descricao: "A IA sugeriu caminhos, mas a peça só deve avançar após aprovação, ajuste ou rejeição humana das teses.",
      href: `#mapa-teses`,
      label: "Revisar teses",
    };
  }

  if (!minutaId) {
    return {
      titulo: "Conferir estrutura da peça",
      descricao: "A estratégia já foi validada. Antes da minuta, revise a ordem das seções, os pedidos e as provas prioritárias.",
      href: `#estrutura-peca`,
      label: "Revisar estrutura",
    };
  }

  if (prontidaoAprovacao && !prontidaoAprovacao.liberado) {
    return {
      titulo: "Fechar bloqueios de auditoria",
      descricao: "A minuta já existe, mas ainda não atende o mínimo jurídico-operacional para aprovação final.",
      href: `#auditoria-aprovacao`,
      label: "Revisar auditoria",
    };
  }

  if (pedidoStatus !== "aprovado") {
    return {
      titulo: "Revisar e fechar a minuta",
      descricao: "A peça já entrou em produção. O foco agora é coerência técnica, pedidos e rastreabilidade.",
      href: `/peticoes/minutas/${minutaId}/editor`,
      label: "Abrir editor",
    };
  }

  return {
    titulo: "Pedido aprovado",
    descricao: "Fluxo principal encerrado. Use o editor e a timeline para registrar ajustes residuais e fechamento operacional.",
    href: `/peticoes/minutas/${minutaId}/editor`,
    label: "Revisar peça aprovada",
  };
}

export default async function PedidoDetalhePage({ params }: PedidoDetalhePageProps) {
  const dataMode = getDataMode();
  const { pedidoId } = await params;
  const pedido = await obterPedidoDePeca(pedidoId);

  if (!pedido) {
    notFound();
  }

  const minuta = await obterMinutaPorPedidoId(pedidoId);
  const pipelineOperacional = await obterPipelineDoPedido(pedido.id).catch(() => null);
  const editorData = minuta ? await obterEditorMinutaOperacional(minuta.id).catch(() => null) : null;
  const documentosDoPedido = await listarDocumentosPorPedido(pedido.id);
  const documentos = documentosDoPedido.length > 0 ? documentosDoPedido : await listarDocumentosPorCaso(pedido.casoId);

  const historico = (pipelineOperacional?.historico ?? []).slice().sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );

  const snapshots = pipelineOperacional?.snapshots ?? [];
  const ultimoSnapshotPorEtapa = consolidarUltimoSnapshotPorEtapa(snapshots);
  const totalEtapas = pipelineOperacional?.etapas.length ?? 0;
  const etapasConcluidas = Array.from(ultimoSnapshotPorEtapa.values()).filter(
    (snapshot) => snapshot.status === "concluido",
  ).length;
  const percentualConclusao = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
  const diasRestantes = calcularDiasRestantesPrazo(pedido.prazoFinal);
  const etapaAtual = pipelineOperacional?.etapaAtual ?? pedido.etapaAtual;
  const prontidaoAprovacao =
    pipelineOperacional?.contextoAtual || minuta
      ? avaliarProntidaoAprovacao({
          contextoJuridico: pipelineOperacional?.contextoAtual ?? null,
          minuta: editorData?.minuta ?? minuta ?? null,
          inteligenciaJuridica: editorData?.inteligenciaJuridica ?? null,
        })
      : undefined;

  const responsavelDefinido = responsavelObrigatorioAtendido(pedido.responsavel);
  const contextoAtual = pipelineOperacional?.contextoAtual ?? null;
  const dossie = contextoAtual?.dossieJuridico ?? null;

  const proximaAcao = definirProximaAcaoRecomendada({
    pedidoId: pedido.id,
    responsavelDefinido,
    contextoAtual,
    minutaId: minuta?.id,
    prontidaoAprovacao,
    pedidoStatus: pedido.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={pedido.titulo}
        description={`${pedido.id} • ${pedido.tipoPeca} • ${pedido.casoId}`}
        meta={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={pedido.status}
              variant={
                pedido.status === "aprovado"
                  ? "sucesso"
                  : pedido.status === "em revisão"
                    ? "alerta"
                    : "implantacao"
              }
            />
            <StatusBadge label={`etapa ${etapaAtual.replaceAll("_", " ")}`} variant="neutro" />
          </div>
        }
      />

      {!responsavelDefinido ? (
        <div id="responsavel" className="scroll-mt-24">
          <AtribuirResponsavelCard pedidoId={pedido.id} responsavelAtual={pedido.responsavel} />
        </div>
      ) : null}

      <PedidoWorkspaceClient
        pedido={pedido}
        minuta={minuta ?? null}
        contextoAtual={contextoAtual}
        dossie={dossie}
        documentos={documentos}
        historico={historico}
        snapshots={snapshots}
        etapaAtual={etapaAtual}
        prontidaoAprovacao={prontidaoAprovacao}
        inteligenciaJuridica={editorData?.inteligenciaJuridica ?? null}
        percentualConclusao={percentualConclusao}
        diasRestantes={diasRestantes}
        responsavelDefinido={responsavelDefinido}
        proximaAcao={proximaAcao}
      />

      <DocumentoUploadPanel
        titulo="Adicionar documento ao pedido"
        descricao="Anexe novos documentos e vincule diretamente ao caso e ao pedido para alimentar contexto e redação."
        fixedVinculos={[
          { tipoEntidade: "caso", entidadeId: pedido.casoId, papel: "principal" },
          { tipoEntidade: "pedido_peca", entidadeId: pedido.id, papel: "apoio" },
        ]}
        mostrarSeletores={false}
        modoUpload={dataMode === "real" ? "cliente_blob" : "api"}
      />
    </div>
  );
}

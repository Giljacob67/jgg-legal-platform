import type { EtapaPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";

export type StatusSlaEtapa = "ok" | "atencao" | "estourado";

export type SeveridadeGovernanca = "alta" | "media" | "baixa";

export type AlertaGovernancaPedido = {
  codigo: string;
  titulo: string;
  descricao: string;
  severidade: SeveridadeGovernanca;
};

export type AvaliacaoSlaEtapa = {
  etapa: EtapaPipeline;
  diasSla: number;
  diasConsumidos: number;
  percentualConsumido: number;
  status: StatusSlaEtapa;
  referenciaInicio: string;
};

const RESPONSAVEL_PLACEHOLDERS = new Set([
  "",
  "distribuição automática",
  "distribuicao automatica",
  "nao definido",
  "não definido",
]);

export const SLA_DIAS_POR_ETAPA: Record<EtapaPipeline, number> = {
  classificacao: 1,
  leitura_documental: 1,
  extracao_de_fatos: 2,
  analise_adversa: 2,
  analise_documental_do_cliente: 2,
  estrategia_juridica: 2,
  pesquisa_de_apoio: 2,
  redacao: 3,
  revisao: 2,
  aprovacao: 1,
  // Etapas do Assistente (não têm SLA operacional)
  assistente_analise_documental: 0,
  assistente_identificacao_peca: 0,
  assistente_estrategia: 0,
  assistente_minuta: 0,
  assistente_confirmacao_estrategia: 0,
};

function normalizarDataDia(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function hojeBase(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function calcularDiasRestantesPrazo(prazoFinal: string): number {
  const prazo = normalizarDataDia(`${prazoFinal}T00:00:00`);
  if (!prazo) {
    return 0;
  }
  return Math.ceil((prazo.getTime() - hojeBase().getTime()) / 86400000);
}

export function responsavelObrigatorioAtendido(responsavel: string | null | undefined): boolean {
  const value = (responsavel ?? "").trim().toLowerCase();
  return value.length > 0 && !RESPONSAVEL_PLACEHOLDERS.has(value);
}

export function obterReferenciaInicioEtapa(
  pedidoCriadoEm: string,
  etapaAtual: EtapaPipeline,
  snapshots: SnapshotPipelineEtapa[] = [],
): string {
  const snapshotEtapa = snapshots
    .filter((snapshot) => snapshot.etapa === etapaAtual)
    .sort((a, b) => new Date(b.executadoEm).getTime() - new Date(a.executadoEm).getTime())[0];

  return snapshotEtapa?.executadoEm ?? pedidoCriadoEm;
}

export function avaliarSlaDaEtapa(input: {
  etapa: EtapaPipeline;
  pedidoCriadoEm: string;
  snapshots?: SnapshotPipelineEtapa[];
}): AvaliacaoSlaEtapa {
  const diasSla = SLA_DIAS_POR_ETAPA[input.etapa];
  const referenciaInicio = obterReferenciaInicioEtapa(
    input.pedidoCriadoEm,
    input.etapa,
    input.snapshots ?? [],
  );
  const referenciaBase = normalizarDataDia(referenciaInicio) ?? hojeBase();
  const diasConsumidos = Math.max(
    0,
    Math.ceil((hojeBase().getTime() - referenciaBase.getTime()) / 86400000),
  );

  const percentualConsumido = diasSla > 0
    ? Math.round((diasConsumidos / diasSla) * 100)
    : 0;

  const limiteAtencao = Math.max(1, Math.ceil(diasSla * 0.7));
  const status: StatusSlaEtapa = diasConsumidos > diasSla
    ? "estourado"
    : diasConsumidos >= limiteAtencao
      ? "atencao"
      : "ok";

  return {
    etapa: input.etapa,
    diasSla,
    diasConsumidos,
    percentualConsumido,
    status,
    referenciaInicio,
  };
}

export function gerarAlertasGovernancaPedido(input: {
  prazoFinal: string;
  etapaAtual: EtapaPipeline;
  pedidoCriadoEm: string;
  responsavel: string | null | undefined;
  snapshots?: SnapshotPipelineEtapa[];
}): AlertaGovernancaPedido[] {
  const alertas: AlertaGovernancaPedido[] = [];

  const diasRestantes = calcularDiasRestantesPrazo(input.prazoFinal);
  if (diasRestantes < 0) {
    alertas.push({
      codigo: "prazo_vencido",
      titulo: "Prazo vencido",
      descricao: `Prazo final vencido há ${Math.abs(diasRestantes)} dia(s).`,
      severidade: "alta",
    });
  } else if (diasRestantes <= 2) {
    alertas.push({
      codigo: "prazo_critico",
      titulo: "Prazo crítico",
      descricao: `Faltam ${diasRestantes} dia(s) para o prazo final do pedido.`,
      severidade: "alta",
    });
  } else if (diasRestantes <= 5) {
    alertas.push({
      codigo: "prazo_atencao",
      titulo: "Prazo em atenção",
      descricao: `Faltam ${diasRestantes} dia(s) para o prazo final do pedido.`,
      severidade: "media",
    });
  }

  if (!responsavelObrigatorioAtendido(input.responsavel)) {
    alertas.push({
      codigo: "responsavel_pendente",
      titulo: "Responsável obrigatório pendente",
      descricao: "Defina um responsável titular antes de executar ou aprovar etapas do pipeline.",
      severidade: "alta",
    });
  }

  const sla = avaliarSlaDaEtapa({
    etapa: input.etapaAtual,
    pedidoCriadoEm: input.pedidoCriadoEm,
    snapshots: input.snapshots,
  });

  if (sla.status === "estourado") {
    alertas.push({
      codigo: "sla_estourado",
      titulo: "SLA da etapa estourado",
      descricao: `Etapa atual consumiu ${sla.diasConsumidos} dia(s), acima do SLA de ${sla.diasSla} dia(s).`,
      severidade: "alta",
    });
  } else if (sla.status === "atencao") {
    alertas.push({
      codigo: "sla_em_atencao",
      titulo: "SLA da etapa em atenção",
      descricao: `Etapa atual consumiu ${sla.diasConsumidos} de ${sla.diasSla} dia(s) previstos.`,
      severidade: "media",
    });
  }

  return alertas;
}

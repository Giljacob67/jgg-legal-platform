import {
  avaliarSlaDaEtapa,
  gerarAlertasGovernancaPedido,
  responsavelObrigatorioAtendido,
  type AlertaGovernancaPedido,
} from "@/modules/peticoes/application/governanca-pedido";
import type { PedidoDePeca } from "@/modules/peticoes/domain/types";

type LinhaInterna = {
  responsavel: string;
  totalPedidos: number;
  pedidosComAlerta: number;
  alertasAlta: number;
  alertasMedia: number;
  alertasBaixa: number;
  alertasTotal: number;
  slaEstourado: number;
  prazoCritico: number;
  responsavelPendente: number;
};

export type AlertaGovernancaResponsavel = LinhaInterna;

export type ResumoGovernancaResponsaveis = {
  totalPedidos: number;
  totalResponsaveis: number;
  totalAlertas: number;
  totalAlertasAlta: number;
  totalAlertasMedia: number;
  totalAlertasBaixa: number;
  totalSlaEstourado: number;
  linhas: AlertaGovernancaResponsavel[];
};

function atualizarLinhaComAlerta(linha: LinhaInterna, alerta: AlertaGovernancaPedido) {
  linha.alertasTotal += 1;
  if (alerta.severidade === "alta") linha.alertasAlta += 1;
  if (alerta.severidade === "media") linha.alertasMedia += 1;
  if (alerta.severidade === "baixa") linha.alertasBaixa += 1;

  if (alerta.codigo === "sla_estourado") linha.slaEstourado += 1;
  if (alerta.codigo === "prazo_vencido" || alerta.codigo === "prazo_critico") linha.prazoCritico += 1;
  if (alerta.codigo === "responsavel_pendente") linha.responsavelPendente += 1;
}

function criarLinha(responsavel: string): LinhaInterna {
  return {
    responsavel,
    totalPedidos: 0,
    pedidosComAlerta: 0,
    alertasAlta: 0,
    alertasMedia: 0,
    alertasBaixa: 0,
    alertasTotal: 0,
    slaEstourado: 0,
    prazoCritico: 0,
    responsavelPendente: 0,
  };
}

export function listarAlertasGovernancaPorResponsavel(
  pedidos: PedidoDePeca[],
): ResumoGovernancaResponsaveis {
  const linhas = new Map<string, LinhaInterna>();
  let totalAlertas = 0;
  let totalAlertasAlta = 0;
  let totalAlertasMedia = 0;
  let totalAlertasBaixa = 0;
  let totalSlaEstourado = 0;

  for (const pedido of pedidos) {
    const responsavel = responsavelObrigatorioAtendido(pedido.responsavel)
      ? pedido.responsavel.trim()
      : "Sem responsável";

    const linha = linhas.get(responsavel) ?? criarLinha(responsavel);
    linha.totalPedidos += 1;

    const alertas = gerarAlertasGovernancaPedido({
      prazoFinal: pedido.prazoFinal,
      etapaAtual: pedido.etapaAtual,
      pedidoCriadoEm: pedido.criadoEm,
      responsavel: pedido.responsavel,
    });

    const sla = avaliarSlaDaEtapa({
      etapa: pedido.etapaAtual,
      pedidoCriadoEm: pedido.criadoEm,
    });
    if (sla.status === "estourado") {
      totalSlaEstourado += 1;
    }

    if (alertas.length > 0) {
      linha.pedidosComAlerta += 1;
    }

    for (const alerta of alertas) {
      atualizarLinhaComAlerta(linha, alerta);
      totalAlertas += 1;
      if (alerta.severidade === "alta") totalAlertasAlta += 1;
      if (alerta.severidade === "media") totalAlertasMedia += 1;
      if (alerta.severidade === "baixa") totalAlertasBaixa += 1;
    }

    linhas.set(responsavel, linha);
  }

  const linhasOrdenadas = [...linhas.values()].sort((a, b) => {
    if (b.alertasAlta !== a.alertasAlta) return b.alertasAlta - a.alertasAlta;
    if (b.alertasTotal !== a.alertasTotal) return b.alertasTotal - a.alertasTotal;
    if (b.totalPedidos !== a.totalPedidos) return b.totalPedidos - a.totalPedidos;
    return a.responsavel.localeCompare(b.responsavel);
  });

  return {
    totalPedidos: pedidos.length,
    totalResponsaveis: linhasOrdenadas.length,
    totalAlertas,
    totalAlertasAlta,
    totalAlertasMedia,
    totalAlertasBaixa,
    totalSlaEstourado,
    linhas: linhasOrdenadas,
  };
}

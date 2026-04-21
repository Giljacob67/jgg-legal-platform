import { describe, expect, it } from "vitest";
import { listarAlertasGovernancaPorResponsavel } from "@/modules/peticoes/application/listarAlertasGovernancaPorResponsavel";
import type { PedidoDePeca } from "@/modules/peticoes/domain/types";

function dataComOffsetDias(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString();
}

function prazoComOffsetDias(offset: number): string {
  return dataComOffsetDias(offset).slice(0, 10);
}

describe("listarAlertasGovernancaPorResponsavel", () => {
  it("deve agregar alertas por responsável e ordenar por severidade", () => {
    const pedidos: PedidoDePeca[] = [
      {
        id: "PED-1",
        casoId: "CAS-1",
        titulo: "Pedido 1",
        tipoPeca: "Petição inicial",
        prioridade: "alta",
        status: "em produção",
        etapaAtual: "classificacao",
        responsavel: "Distribuição automática",
        prazoFinal: prazoComOffsetDias(1),
        criadoEm: dataComOffsetDias(-3),
      },
      {
        id: "PED-2",
        casoId: "CAS-2",
        titulo: "Pedido 2",
        tipoPeca: "Contestação",
        prioridade: "média",
        status: "em revisão",
        etapaAtual: "revisao",
        responsavel: "Mariana Couto",
        prazoFinal: prazoComOffsetDias(6),
        criadoEm: dataComOffsetDias(-1),
      },
      {
        id: "PED-3",
        casoId: "CAS-3",
        titulo: "Pedido 3",
        tipoPeca: "Réplica",
        prioridade: "baixa",
        status: "em triagem",
        etapaAtual: "classificacao",
        responsavel: "Mariana Couto",
        prazoFinal: prazoComOffsetDias(10),
        criadoEm: dataComOffsetDias(0),
      },
    ];

    const resumo = listarAlertasGovernancaPorResponsavel(pedidos);

    expect(resumo.totalPedidos).toBe(3);
    expect(resumo.totalResponsaveis).toBe(2);
    expect(resumo.totalAlertas).toBeGreaterThan(0);
    expect(resumo.totalAlertasAlta).toBeGreaterThan(0);
    expect(resumo.totalSlaEstourado).toBeGreaterThan(0);

    expect(resumo.linhas[0].responsavel).toBe("Sem responsável");
    expect(resumo.linhas[0].alertasAlta).toBeGreaterThan(0);

    const linhaMariana = resumo.linhas.find((linha) => linha.responsavel === "Mariana Couto");
    expect(linhaMariana).toBeTruthy();
    expect(linhaMariana?.totalPedidos).toBe(2);
  });
});

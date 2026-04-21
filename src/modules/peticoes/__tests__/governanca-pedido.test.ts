import { describe, expect, it } from "vitest";
import {
  avaliarSlaDaEtapa,
  calcularDiasRestantesPrazo,
  gerarAlertasGovernancaPedido,
  responsavelObrigatorioAtendido,
} from "@/modules/peticoes/application/governanca-pedido";

function hojeComOffsetDias(offset: number): string {
  const now = new Date();
  now.setDate(now.getDate() + offset);
  return now.toISOString();
}

describe("governanca-pedido", () => {
  it("deve validar responsável obrigatório", () => {
    expect(responsavelObrigatorioAtendido("Mariana Couto")).toBe(true);
    expect(responsavelObrigatorioAtendido("Distribuição automática")).toBe(false);
    expect(responsavelObrigatorioAtendido("")).toBe(false);
  });

  it("deve calcular dias restantes de prazo", () => {
    const amanha = hojeComOffsetDias(1).slice(0, 10);
    const ontem = hojeComOffsetDias(-1).slice(0, 10);

    expect(calcularDiasRestantesPrazo(amanha)).toBeGreaterThanOrEqual(1);
    expect(calcularDiasRestantesPrazo(ontem)).toBeLessThan(0);
  });

  it("deve classificar SLA da etapa como estourado quando exceder limite", () => {
    const sla = avaliarSlaDaEtapa({
      etapa: "classificacao",
      pedidoCriadoEm: hojeComOffsetDias(-3),
    });

    expect(sla.status).toBe("estourado");
    expect(sla.diasConsumidos).toBeGreaterThan(sla.diasSla);
  });

  it("deve gerar alertas de prazo, responsável e SLA", () => {
    const alertas = gerarAlertasGovernancaPedido({
      prazoFinal: hojeComOffsetDias(1).slice(0, 10),
      etapaAtual: "classificacao",
      pedidoCriadoEm: hojeComOffsetDias(-2),
      responsavel: "Distribuição automática",
    });

    expect(alertas.some((item) => item.codigo === "prazo_critico")).toBe(true);
    expect(alertas.some((item) => item.codigo === "responsavel_pendente")).toBe(true);
    expect(alertas.some((item) => item.codigo === "sla_estourado")).toBe(true);
  });
});

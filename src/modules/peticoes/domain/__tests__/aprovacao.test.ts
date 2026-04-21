import { describe, expect, it } from "vitest";
import { perfilTemAlcadaAprovacao, perfilTemAlcadaExecucaoEstagio } from "@/modules/peticoes/domain/aprovacao";

describe("alçadas de petições", () => {
  it("deve permitir aprovação para coordenador, sócio e administrador", () => {
    expect(perfilTemAlcadaAprovacao("coordenador_juridico")).toBe(true);
    expect(perfilTemAlcadaAprovacao("socio_direcao")).toBe(true);
    expect(perfilTemAlcadaAprovacao("administrador_sistema")).toBe(true);
  });

  it("deve bloquear aprovação para advogado e estagiário", () => {
    expect(perfilTemAlcadaAprovacao("advogado")).toBe(false);
    expect(perfilTemAlcadaAprovacao("estagiario_assistente")).toBe(false);
  });

  it("deve permitir execução de estágio para perfis operacionais jurídicos", () => {
    expect(perfilTemAlcadaExecucaoEstagio("advogado", "triagem")).toBe(true);
    expect(perfilTemAlcadaExecucaoEstagio("coordenador_juridico", "estrategia")).toBe(true);
    expect(perfilTemAlcadaExecucaoEstagio("socio_direcao", "minuta")).toBe(true);
  });

  it("deve bloquear execução de estágio para administrador e operacional", () => {
    expect(perfilTemAlcadaExecucaoEstagio("administrador_sistema", "triagem")).toBe(false);
    expect(perfilTemAlcadaExecucaoEstagio("operacional_admin", "triagem")).toBe(false);
  });
});

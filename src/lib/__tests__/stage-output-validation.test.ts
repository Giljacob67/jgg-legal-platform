import { describe, expect, it } from "vitest";
import { validateStageOutput } from "@/lib/ai/stage-output-validation";

describe("validateStageOutput", () => {
  it("valida JSON correto para triagem", () => {
    const raw = JSON.stringify({
      tipo_peca: "Petição inicial",
      materia: "civel",
      polo_representado: "ativo",
      urgencia: "normal",
      complexidade: "media",
      justificativa_polo: "Cliente é autor nas partes.",
      justificativa_urgencia: "Prazo superior a 15 dias.",
      justificativa_complexidade: "Conjunto probatório médio.",
    });

    const result = validateStageOutput("triagem", raw);
    expect(result.schemaValid).toBe(true);
    expect(result.validationError).toBeUndefined();
  });

  it("marca erro quando JSON de estratégia é inválido", () => {
    const raw = JSON.stringify({
      teses_aplicaveis: [],
    });

    const result = validateStageOutput("estrategia", raw);
    expect(result.schemaValid).toBe(false);
    expect(result.validationError).toBeDefined();
  });

  it("aceita minuta como texto longo", () => {
    const texto = "A".repeat(240);
    const result = validateStageOutput("minuta", texto);
    expect(result.schemaValid).toBe(true);
    expect(result.structured.conteudo).toBe(texto);
  });
});

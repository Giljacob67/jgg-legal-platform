import { describe, it, expect } from "vitest";
import {
  TriagemPipelineSchema,
  ExtracaoFatosSchema,
  AnaliseAdversaSchema,
  EstrategiaSchema,
  AprovacaoSchema,
  SCHEMAS_POR_ESTAGIO,
} from "@/modules/peticoes/domain/schemas-pipeline";

describe("TriagemPipelineSchema", () => {
  const valido = {
    tipo_peca: "Contestação",
    materia: "civel",
    polo_representado: "passivo",
    urgencia: "normal",
    complexidade: "media",
  };

  it("deve aceitar payload mínimo válido", () => {
    const result = TriagemPipelineSchema.safeParse(valido);
    expect(result.success).toBe(true);
  });

  it("deve aceitar campos opcionais", () => {
    const result = TriagemPipelineSchema.safeParse({
      ...valido,
      justificativa_polo: "Cliente é réu na ação",
      justificativa_urgencia: "Prazo de contestação em 15 dias",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar polo_representado inválido", () => {
    const result = TriagemPipelineSchema.safeParse({ ...valido, polo_representado: "neutro" });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar urgencia inválida", () => {
    const result = TriagemPipelineSchema.safeParse({ ...valido, urgencia: "crítica" });
    expect(result.success).toBe(false);
  });
});

describe("ExtracaoFatosSchema", () => {
  const valido = {
    fatos_cronologicos: [
      { data: "01/03/2026", descricao: "Contrato assinado", controverso: false },
    ],
  };

  it("deve aceitar payload mínimo válido", () => {
    const result = ExtracaoFatosSchema.safeParse(valido);
    expect(result.success).toBe(true);
  });

  it("deve aceitar lista vazia de fatos", () => {
    const result = ExtracaoFatosSchema.safeParse({ fatos_cronologicos: [] });
    expect(result.success).toBe(true);
  });

  it("deve aceitar campos opcionais de prazo", () => {
    const result = ExtracaoFatosSchema.safeParse({
      ...valido,
      prazo_prescricional: "5 anos — Art. 206, §5º, I, CC",
      prazo_decadencial: "não identificado",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar fatos_cronologicos não-array", () => {
    const result = ExtracaoFatosSchema.safeParse({ fatos_cronologicos: "texto" });
    expect(result.success).toBe(false);
  });
});

describe("AnaliseAdversaSchema", () => {
  const valido = {
    pontos_fortes: ["Contrato claro"],
    pontos_vulneraveis: ["Entrega parcial"],
    argumentos_adversos_previstos: ["Inadimplência justificada"],
    riscos_processuais: ["Prescrição"],
    riscos_especificos_materia: ["Alegação de fortuito"],
    nivel_risco_geral: "medio",
    recomendacoes_cautela: "Verificar prazo prescricional antes de protocolar.",
  };

  it("deve aceitar payload válido completo", () => {
    const result = AnaliseAdversaSchema.safeParse(valido);
    expect(result.success).toBe(true);
  });

  it("deve rejeitar nivel_risco_geral fora do enum", () => {
    const result = AnaliseAdversaSchema.safeParse({ ...valido, nivel_risco_geral: "critico" });
    expect(result.success).toBe(false);
  });
});

describe("EstrategiaSchema", () => {
  const valido = {
    teses_aplicaveis: [
      { titulo: "Impenhorabilidade rural", fundamento_legal: "Art. 5º, XXVI, CF", prioridade: "principal" },
    ],
    linha_argumentativa: "Demonstrar que o imóvel é protegido por impenhorabilidade constitucional.",
  };

  it("deve aceitar payload mínimo válido", () => {
    const result = EstrategiaSchema.safeParse(valido);
    expect(result.success).toBe(true);
  });

  it("deve rejeitar tese com prioridade inválida", () => {
    const result = EstrategiaSchema.safeParse({
      ...valido,
      teses_aplicaveis: [{ ...valido.teses_aplicaveis[0], prioridade: "terciaria" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("AprovacaoSchema", () => {
  it("deve aceitar resultado aprovado", () => {
    const result = AprovacaoSchema.safeParse({ resultado: "aprovado" });
    expect(result.success).toBe(true);
  });

  it("deve aceitar resultado rejeitado com observacoes", () => {
    const result = AprovacaoSchema.safeParse({
      resultado: "rejeitado",
      observacoes: "Revisar pedidos finais.",
      data_aprovacao: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar resultado fora do enum", () => {
    const result = AprovacaoSchema.safeParse({ resultado: "pendente" });
    expect(result.success).toBe(false);
  });
});

describe("SCHEMAS_POR_ESTAGIO", () => {
  it("deve conter schemas para todos os estágios estruturados", () => {
    expect(SCHEMAS_POR_ESTAGIO["triagem"]).toBeDefined();
    expect(SCHEMAS_POR_ESTAGIO["extracao-fatos"]).toBeDefined();
    expect(SCHEMAS_POR_ESTAGIO["analise-adversa"]).toBeDefined();
    expect(SCHEMAS_POR_ESTAGIO["estrategia"]).toBeDefined();
  });

  it("não deve conter schema para minuta (texto livre)", () => {
    // @ts-expect-error — minuta não é chave válida intencionalmente
    expect(SCHEMAS_POR_ESTAGIO["minuta"]).toBeUndefined();
  });
});

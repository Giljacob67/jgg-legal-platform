import { z } from "zod";
import type { EstagioExecutavel } from "@/modules/peticoes/domain/types";

const triagemStageSchema = z.object({
  tipo_peca: z.string().min(2),
  materia: z.string().min(2),
  polo_representado: z.enum(["ativo", "passivo", "indefinido"]),
  urgencia: z.string().min(2),
  complexidade: z.string().min(2),
  justificativa_polo: z.string().min(2),
  justificativa_urgencia: z.string().min(2),
  justificativa_complexidade: z.string().min(2),
});

const extracaoFatosStageSchema = z.object({
  fatos_cronologicos: z.array(
    z.object({
      data: z.string(),
      descricao: z.string(),
      documentos_referenciados: z.array(z.string()).default([]),
      controverso: z.boolean().optional(),
    }),
  ),
  prazo_prescricional: z.string().optional(),
  prazo_decadencial: z.string().optional(),
  dados_especificos_materia: z.record(z.string(), z.unknown()).optional(),
  observacoes: z.string().optional(),
});

const analiseAdversaStageSchema = z.object({
  pontos_fortes: z.array(z.string()),
  pontos_vulneraveis: z.array(z.string()),
  argumentos_adversos_previstos: z.array(z.string()),
  riscos_processuais: z.array(z.string()),
  riscos_especificos_materia: z.array(z.string()).optional(),
  nivel_risco_geral: z.string(),
  recomendacoes_cautela: z.string().optional(),
});

const estrategiaStageSchema = z.object({
  teses_aplicaveis: z.array(
    z.object({
      titulo: z.string(),
      fundamento_legal: z.string(),
      prioridade: z.enum(["principal", "secundaria"]).optional(),
    }),
  ),
  linha_argumentativa: z.string(),
  pontos_a_evitar: z.array(z.string()).optional(),
  pedidos_recomendados: z.array(z.string()).optional(),
});

const minutaStageSchema = z.object({
  conteudo: z.string().min(200),
});

function extractJSONObject(text: string): unknown | null {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return null;
  }
}

function schemaForStage(estagio: EstagioExecutavel) {
  switch (estagio) {
    case "triagem":
      return triagemStageSchema;
    case "extracao-fatos":
      return extracaoFatosStageSchema;
    case "analise-adversa":
      return analiseAdversaStageSchema;
    case "estrategia":
      return estrategiaStageSchema;
    case "minuta":
      return minutaStageSchema;
  }
}

export function validateStageOutput(estagio: EstagioExecutavel, rawText: string): {
  schemaValid: boolean;
  structured: Record<string, unknown>;
  validationError?: string;
} {
  if (estagio === "minuta") {
    const parsed = minutaStageSchema.safeParse({ conteudo: rawText.trim() });
    if (!parsed.success) {
      return {
        schemaValid: false,
        structured: { conteudo: rawText.trim() },
        validationError: parsed.error.issues.map((issue) => issue.message).join("; "),
      };
    }
    return { schemaValid: true, structured: parsed.data };
  }

  const extracted = extractJSONObject(rawText);
  if (!extracted) {
    return {
      schemaValid: false,
      structured: { texto_bruto: rawText.trim() },
      validationError: "Resposta não contém JSON válido.",
    };
  }

  const schema = schemaForStage(estagio);
  const parsed = schema.safeParse(extracted);
  if (!parsed.success) {
    return {
      schemaValid: false,
      structured: {
        ...((typeof extracted === "object" && extracted !== null ? extracted : {}) as Record<string, unknown>),
        texto_bruto: rawText.trim(),
      },
      validationError: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    };
  }

  return {
    schemaValid: true,
    structured: parsed.data as Record<string, unknown>,
  };
}

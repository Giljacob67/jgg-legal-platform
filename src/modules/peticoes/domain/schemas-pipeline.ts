import { z } from "zod";

// ── Estágio: triagem ──────────────────────────────────────────────────────────

/**
 * Schema de saída para o estágio de triagem/classificação.
 * Corresponde ao JSON solicitado em buildTriagemPrompt().
 */
export const TriagemPipelineSchema = z.object({
  tipo_peca: z.string().describe("Tipo de peça jurídica mais adequada"),
  materia: z.string().describe("Matéria jurídica principal"),
  polo_representado: z.enum(["ativo", "passivo", "indefinido"]),
  urgencia: z.enum(["urgente", "normal"]),
  complexidade: z.enum(["simples", "media", "complexa"]),
  justificativa_polo: z.string().optional(),
  justificativa_urgencia: z.string().optional(),
  justificativa_complexidade: z.string().optional(),
});

export type TriagemPipelineOutput = z.infer<typeof TriagemPipelineSchema>;

// ── Estágio: extracao-fatos ───────────────────────────────────────────────────

/**
 * Schema de saída para o estágio de extração de fatos.
 * Corresponde ao JSON solicitado em buildExtracaoFatosPrompt().
 */
export const ExtracaoFatosSchema = z.object({
  fatos_cronologicos: z.array(
    z.object({
      data: z.string(),
      descricao: z.string(),
      documentos_referenciados: z.array(z.string()).optional(),
      controverso: z.boolean().optional(),
    }),
  ),
  prazo_prescricional: z.string().optional(),
  prazo_decadencial: z.string().optional(),
  dados_especificos_materia: z.record(z.string(), z.unknown()).optional(),
  observacoes: z.string().optional(),
});

export type ExtracaoFatosOutput = z.infer<typeof ExtracaoFatosSchema>;

// ── Estágio: analise-adversa ──────────────────────────────────────────────────

/**
 * Schema de saída para o estágio de análise adversarial.
 * Usado para validar estruturação e consistência dos outputs da IA.
 */
export const AnaliseAdversaSchema = z.object({
  pontos_fortes: z
    .array(z.string())
    .describe("Argumentos favoráveis ao nosso cliente"),
  pontos_vulneraveis: z
    .array(z.string())
    .describe("Pontos que a parte adversa vai explorar"),
  argumentos_adversos_previstos: z
    .array(z.string())
    .describe("Principais argumentos esperados da contraparte"),
  riscos_processuais: z
    .array(z.string())
    .describe("Riscos processuais: prescrição, ilegitimidade, incompetência, etc."),
  riscos_especificos_materia: z
    .array(z.string())
    .describe("Riscos específicos da matéria jurídica em questão"),
  nivel_risco_geral: z.enum(["baixo", "medio", "alto"]).describe(
    "Nível de risco geral do caso para nosso cliente",
  ),
  recomendacoes_cautela: z.string().describe(
    "Recomendações de cautela processual para mitigação de riscos",
  ),
});

export type AnaliseAdversaOutput = z.infer<typeof AnaliseAdversaSchema>;

/**
 * Schema de saída para pesquisa de apoio na biblioteca de conhecimento.
 */
export const PesquisaApoioSchema = z.object({
  chunks_utilizados: z
    .array(z.string())
    .describe("IDs ou conteúdos dos chunks utilizados como apoio"),
  fundamentacao_referencias: z
    .array(z.string())
    .describe("Referências legais/jurisprudenciais encontradas"),
  lacunas_conhecimento: z
    .array(z.string())
    .describe("Áreas onde a biblioteca não possui informação suficiente"),
  qualidade_informacional: z
    .enum(["alta", "media", "baixa"])
    .describe("Qualidade geral da informação disponível na biblioteca"),
  recomendacao_expansao: z
    .string()
    .optional()
    .describe("Sugestão de expansão da biblioteca com novos documentos"),
});

export type PesquisaApoioOutput = z.infer<typeof PesquisaApoioSchema>;

/**
 * Schema de saída para análise documental do cliente.
 */
export const AnaliseDocumentalClienteSchema = z.object({
  documentos_identificados: z
    .array(
      z.object({
        titulo: z.string(),
        tipo: z.string(),
        relevancia: z.enum(["alta", "media", "baixa"]),
        pontos_chave: z.array(z.string()),
      }),
    )
    .describe("Documentos do cliente relevantes para o caso"),
  fatos_confirmados: z
    .array(z.string())
    .describe("Fatos que têm suporte documental direto"),
  fatos_contraditorios: z
    .array(z.string())
    .describe("Fatos que contradizem a narrativa do caso ou geram质疑"),
  pendencias_documentais: z
    .array(z.string())
    .describe("Documentos que ainda precisam ser obtidos ou complementados"),
  avaliacao_geral: z
    .string()
    .describe("Avaliação geral do corpo documental do cliente"),
});

export type AnaliseDocumentalClienteOutput = z.infer<typeof AnaliseDocumentalClienteSchema>;

// ── Estágio: estrategia ───────────────────────────────────────────────────────

/**
 * Schema de saída para o estágio de estratégia jurídica.
 * Corresponde ao JSON solicitado em buildEstrategiaPrompt().
 */
export const EstrategiaSchema = z.object({
  teses_aplicaveis: z.array(
    z.object({
      titulo: z.string(),
      fundamento_legal: z.string(),
      prioridade: z.enum(["principal", "secundaria"]),
    }),
  ),
  linha_argumentativa: z.string(),
  pontos_a_evitar: z.array(z.string()).optional(),
  pedidos_recomendados: z.array(z.string()).optional(),
});

export type EstrategiaOutput = z.infer<typeof EstrategiaSchema>;

// ── Mapa de schemas por estágio ───────────────────────────────────────────────

/**
 * Schemas para os estágios que produzem JSON estruturado.
 * O estágio "minuta" é intencionalmente omitido — gera texto livre (prose).
 */
export const SCHEMAS_POR_ESTAGIO = {
  triagem: TriagemPipelineSchema,
  "extracao-fatos": ExtracaoFatosSchema,
  "analise-adversa": AnaliseAdversaSchema,
  estrategia: EstrategiaSchema,
} as const;

// ── Estágio: aprovacao ────────────────────────────────────────────────────────

/**
 * Schema de saída para o estágio de aprovação.
 * Representa o registro formal de aprovação humana ou automática.
 */
export const AprovacaoSchema = z.object({
  resultado: z
    .enum(["aprovado", "rejeitado", "revisao_pendente"])
    .describe("Resultado da etapa de aprovação"),
  observacoes: z
    .string()
    .optional()
    .describe("Observações do revisor ou sistema"),
  data_aprovacao: z
    .string()
    .optional()
    .describe("ISO timestamp da aprovação"),
  // Se o campo acima for null, significa que a etapa ainda não foi executada
});

export type AprovacaoOutput = z.infer<typeof AprovacaoSchema>;
// ── Diagnóstico Documental do Assistente ──────────────────────────────────────

/**
 * Schema de saída para o diagnóstico documental do Assistente de Petição.
 * Usado na ação rápida "Analisar documentos" com generateObject + Zod.
 */
export const DiagnosticoDocumentalAssistenteSchema = z.object({
  documentosAnalisados: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      tipo: z.string(),
      status: z.string(),
      fatosExtraidos: z.array(z.string()).optional(),
    }),
  ).describe("Documentos processados com fatos extraídos"),
  tipoAcaoProvavel: z.string().describe("Tipo de ação judicial ou medida mais provável"),
  parteProvavelmenteRepresentada: z.string().describe("Polo ativo, passivo ou indefinido com justificativa"),
  pecaCabivelSugerida: z.string().describe("Nome da peça jurídica mais adequada"),
  fatosRelevantes: z.array(z.string()).describe("Fatos relevantes extraídos dos documentos"),
  pontosControvertidos: z.array(z.string()).describe("Pontos controvertidos identificados"),
  riscosFragilidades: z.array(z.string()).describe("Riscos ou fragilidades do caso"),
  documentosFatosFaltantes: z.array(z.string()).describe("Documentos ou fatos ainda faltantes"),
  perguntasMinimas: z.array(z.string()).describe("Perguntas mínimas para o advogado responder"),
  proximaAcaoRecomendada: z.string().describe("Próxima ação operacional recomendada"),
  nivelConfianca: z.enum(["alta", "media", "baixa"]).describe("Nível geral de confiança do diagnóstico"),
  fonte: z.enum(["real", "parcial", "simulado"]).describe("Fonte do diagnóstico"),
  observacoes: z.string().optional().describe("Observações sobre limitações ou fonte dos dados"),
});

export type DiagnosticoDocumentalAssistenteOutput = z.infer<typeof DiagnosticoDocumentalAssistenteSchema>;

// ── Identificação de Peça Cabível do Assistente ──────────────────────────────

/**
 * Schema de saída para identificação de peça cabível do Assistente.
 * Usado na ação rápida "Identificar peça cabível" com generateObject + Zod.
 */
export const IdentificacaoPecaAssistenteSchema = z.object({
  pecaCabivel: z.string().describe("Nome da peça jurídica mais adequada"),
  tipoAcaoProvavel: z.string().describe("Tipo de ação judicial ou medida mais provável"),
  faseProcessualProvavel: z.string().describe("Fase processual provável do caso"),
  parteProvavelmenteRepresentada: z.string().describe("Polo ativo, passivo ou indefinido com justificativa"),
  poloProvavel: z.enum(["ativo", "passivo", "indefinido"]).describe("Polo processual provável"),
  grauConfianca: z.enum(["alta", "media", "baixa"]).describe("Nível de confiança da identificação"),
  fundamentosDaInferencia: z.array(z.string()).describe("Fundamentos que levaram à identificação"),
  documentosConsiderados: z.array(z.string()).describe("Documentos considerados na inferência"),
  pontosDeIncerteza: z.array(z.string()).describe("Pontos que ainda geram incerteza"),
  perguntasDeConfirmacao: z.array(z.string()).describe("Perguntas mínimas para o advogado confirmar"),
  proximaAcaoRecomendada: z.string().describe("Próxima ação operacional recomendada"),
  podeAvancarParaEstrategia: z.boolean().describe("Se é seguro avançar para estratégia"),
  fonte: z.enum(["real", "parcial", "simulado"]).describe("Fonte da identificação"),
  observacoes: z.string().optional().describe("Observações sobre limitações ou fonte dos dados"),
});

export type IdentificacaoPecaAssistenteOutput = z.infer<typeof IdentificacaoPecaAssistenteSchema>;

// ── Estratégia do Assistente ──────────────────────────────────────────────────

/**
 * Schema de saída para a ação rápida "Sugerir estratégia" do Assistente.
 * Usado com generateObject + Zod.
 */
export const EstrategiaAssistenteSchema = z.object({
  estrategiaRecomendada: z.string().describe("Síntese da estratégia recomendada"),
  objetivoProcessual: z.string().describe("Objetivo processual central da peça"),
  linhaArgumentativaPrincipal: z.string().describe("Linha argumentativa principal em uma frase"),
  tesesPrincipais: z
    .array(
      z.object({
        titulo: z.string(),
        fundamentoLegal: z.string(),
        prioridade: z.enum(["principal", "secundaria"]),
      }),
    )
    .describe("Teses principais e subsidiárias"),
  tesesSubsidiarias: z
    .array(
      z.object({
        titulo: z.string(),
        fundamentoLegal: z.string(),
      }),
    )
    .describe("Teses subsidiárias"),
  pedidosRecomendados: z.array(z.string()).describe("Pedidos recomendados na peça"),
  pedidosArriscados: z.array(z.string()).describe("Pedidos considerados arriscados ou contraindicados"),
  riscosEFragilidades: z.array(z.string()).describe("Riscos e fragilidades estratégicas"),
  pontosAEvitar: z.array(z.string()).describe("Pontos a evitar na argumentação"),
  provasEDocumentosDeApoio: z.array(z.string()).describe("Provas e documentos de apoio recomendados"),
  perguntasPendentes: z.array(z.string()).describe("Perguntas pendentes para o advogado"),
  nivelConfianca: z.enum(["alta", "media", "baixa"]).describe("Nível de confiança da estratégia"),
  podeAvancarParaMinuta: z.boolean().describe("Se é seguro avançar para redação de minuta"),
  proximaAcaoRecomendada: z.string().describe("Próxima ação operacional recomendada"),
  fonte: z.enum(["real", "parcial", "simulado"]).describe("Fonte da estratégia"),
  observacoes: z.string().optional().describe("Observações sobre limitações"),
});

export type EstrategiaAssistenteOutput = z.infer<typeof EstrategiaAssistenteSchema>;

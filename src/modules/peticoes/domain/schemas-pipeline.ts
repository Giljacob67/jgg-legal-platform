import { z } from "zod";

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
  calidad_informacional: z
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
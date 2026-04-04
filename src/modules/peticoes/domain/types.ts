import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

export type TipoPeca =
  | "Petição inicial"
  | "Contestação"
  | "Réplica"
  | "Embargos à execução"
  | "Impugnação"
  | "Recurso"
  | "Manifestação"
  | "Apelação cível"
  | "Recurso especial cível"
  | "Agravo de instrumento"
  | "Agravo interno"
  | "Embargos de declaração"
  | "Mandado de segurança"
  | "Habeas corpus"
  | "Reconvenção"
  | "Exceção de pré-executividade"
  | "Pedido de tutela de urgência"
  | "Contrarrazões";

/**
 * Define EXATAMENTE o que o advogado quer que o agente faça com o documento.
 * Sem isso, o agente não sabe se deve analisar, contra-atacar ou redigir.
 */
export type IntencaoProcessual =
  // Defesa / polo passivo
  | "redigir_contestacao"           // Li uma petição inicial e quero contestar
  | "redigir_impugnacao"            // Li uma manifestação e quero impugnar
  | "redigir_replica"               // Li uma contestação e quero replicar
  | "redigir_embargos"              // Li execução e quero embargar
  | "redigir_excecao_executividade" // Li execução e quero fazer exceção
  // Ataque / polo ativo
  | "redigir_peticao_inicial"       // Quero abrir um processo novo
  | "redigir_recurso"               // Quero recorrer de uma decisão
  | "redigir_agravo"                // Quero agravar de uma decisão interlocutória
  | "redigir_mandado_seguranca"     // Quero impetrar um writs
  // Análise / suporte
  | "analisar_documento_adverso"    // Quero entender pontos vulneráveis do documento
  | "extrair_fatos"                 // Quero mapear fatos relevantes para a estratégia
  | "mapear_prazos"                 // Quero identificar prazos crucíais no processo
  | "avaliar_riscos"                // Quero um parecer de riscos e pontos fracos
  | "redigir_peticao_avulsa"        // Outros tipos de petição personalizada
  | "outro";                        // Intenção livre — descrita pelo advogado em texto

export const INTENCOES_POR_DOCUMENTO: Record<string, IntencaoProcessual[]> = {
  "Contestação": ["analisar_documento_adverso", "redigir_replica", "extrair_fatos", "avaliar_riscos"],
  "Petição inicial": ["redigir_contestacao", "analisar_documento_adverso", "avaliar_riscos", "mapear_prazos"],
  "Manifestação": ["redigir_impugnacao", "analisar_documento_adverso", "extrair_fatos"],
  "Recurso": ["analisar_documento_adverso", "redigir_replica", "avaliar_riscos"],
  "Embargos à execução": ["redigir_excecao_executividade", "analisar_documento_adverso"],
  "default": ["analisar_documento_adverso", "extrair_fatos", "mapear_prazos", "redigir_peticao_avulsa"],
};

export const LABEL_INTENCAO: Record<IntencaoProcessual, string> = {
  redigir_contestacao: "🛡️ Redigir Contestação",
  redigir_impugnacao: "🛡️ Redigir Impugnação à manifestação",
  redigir_replica: "🔁 Redigir Réplica",
  redigir_embargos: "⛔ Redigir Embargos à Execução",
  redigir_excecao_executividade: "❌ Exceção de Pré-Executividade",
  redigir_peticao_inicial: "📝 Redigir Petição Inicial",
  redigir_recurso: "↗️ Redigir Recurso",
  redigir_agravo: "📹 Redigir Agravo ",
  redigir_mandado_seguranca: "⚖️ Mandado de Segurança / Habeas Corpus",
  analisar_documento_adverso: "🔍 Analisar Documento Adversário",
  extrair_fatos: "📋 Extrair Fatos e Cronologia",
  mapear_prazos: "📅 Mapear Prazos Processuais",
  avaliar_riscos: "⚠️ Parecer de Riscos e Pontos Fracos",
  redigir_peticao_avulsa: "📝 Redigir Petição (outro tipo)",
  outro: "✏️ Outro — descrever livremente",
};

export type PrioridadePedido = "baixa" | "média" | "alta";

export type StatusPedido = "em triagem" | "em produção" | "em revisão" | "aprovado";

export type EtapaPipeline =
  | "classificacao"
  | "leitura_documental"
  | "extracao_de_fatos"
  | "analise_adversa"
  | "analise_documental_do_cliente"
  | "estrategia_juridica"
  | "pesquisa_de_apoio"
  | "redacao"
  | "revisao"
  | "aprovacao";

// Estágios executáveis via IA no pipeline
export type EstagioExecutavel =
  | "triagem"
  | "extracao-fatos"
  | "analise-adversa"
  | "estrategia"
  | "minuta";

export const MAPA_ESTAGIO_PIPELINE: Record<EstagioExecutavel, EtapaPipeline> = {
  triagem: "classificacao",
  "extracao-fatos": "extracao_de_fatos",
  "analise-adversa": "analise_adversa",
  estrategia: "estrategia_juridica",
  minuta: "redacao",
};

export interface EtapaPipelineInfo {
  id: EtapaPipeline;
  nome: string;
  priorizadaMvp: boolean;
}

export interface PedidoDePeca {
  id: string;
  casoId: string;
  titulo: string;
  tipoPeca: TipoPeca;
  prioridade: PrioridadePedido;
  status: StatusPedido;
  etapaAtual: EtapaPipeline;
  responsavel: string;
  prazoFinal: string;
  criadoEm: string;
  /** Qual é o objetivo processual deste pedido. Define o foco do agente de IA. */
  intencaoProcessual?: IntencaoProcessual;
  /** ID do documento adverso que originou este pedido (ex: contestation uploaded) */
  documentoOrigemId?: string;
}

export interface HistoricoPipeline {
  id: string;
  etapa: EtapaPipeline;
  descricao: string;
  data: string;
  responsavel: string;
}

export type StatusSnapshotPipeline = "pendente" | "em_andamento" | "concluido" | "erro" | "mock_controlado";

export interface SnapshotPipelineEtapa {
  id: string;
  pedidoId: string;
  etapa: EtapaPipeline;
  versao: number;
  entradaRef: Record<string, unknown>;
  saidaEstruturada: Record<string, unknown>;
  status: StatusSnapshotPipeline;
  executadoEm: string;
  codigoErro?: string;
  mensagemErro?: string;
  tentativa: number;
}

export interface ReferenciaDocumentalContexto {
  documentoId: string;
  titulo: string;
  tipoDocumento: string;
  trecho?: string;
}

export interface ContextoJuridicoPedido {
  id: string;
  pedidoId: string;
  versaoContexto: number;
  fatosRelevantes: string[];
  cronologia: Array<{ data: string; descricao: string; documentoId?: string }>;
  pontosControvertidos: string[];
  documentosChave: Array<{ documentoId: string; titulo: string; tipoDocumento: string }>;
  referenciasDocumentais: ReferenciaDocumentalContexto[];
  estrategiaSugerida: string;
  fontesSnapshot: Array<{ etapa: EtapaPipeline; versao: number }>;
  criadoEm: string;
}

export interface VersaoMinuta {
  id: string;
  numero: number;
  criadoEm: string;
  autor: string;
  resumoMudancas: string;
  conteudo: string;
  contextoVersaoOrigem?: number;
  templateIdOrigem?: string;
  templateNomeOrigem?: string;
  templateVersaoOrigem?: number;
  tipoPecaCanonicaOrigem?: TipoPecaCanonica;
  materiaCanonicaOrigem?: MateriaCanonica;
  referenciasDocumentaisOrigem?: string[];
}

export interface Minuta {
  id: string;
  pedidoId: string;
  titulo: string;
  conteudoAtual: string;
  versoes: VersaoMinuta[];
}

export interface NovoPedidoPayload {
  casoId: string;
  titulo: string;
  tipoPeca: TipoPeca;
  prioridade: PrioridadePedido;
  prazoFinal: string;
  /** Objetivo processual explícito: o que o agente deve fazer com este pedido */
  intencaoProcessual?: IntencaoProcessual;
  /** Descrição livre quando intencaoProcessual === 'outro' */
  intencaoCustom?: string;
  /** ID do documento que motivou a criação do pedido */
  documentoOrigemId?: string;
}

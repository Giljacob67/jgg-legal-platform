import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

// ─── TIPO DE PEÇA ─────────────────────────────────────────────────────────────
// 67 tipos organizados por área jurídica.
export type TipoPeca =
  // ── Cível Geral ──────────────────────────────────────────────────────────
  | "Petição inicial"
  | "Contestação"
  | "Réplica"
  | "Reconvenção"
  | "Manifestação"
  | "Impugnação"
  | "Contrarrazões"
  | "Pedido de tutela de urgência"
  | "Pedido de tutela antecipada antecedente"
  | "Notificação extrajudicial"
  | "Interpelação judicial"
  | "Memoriais"
  | "Alegações finais — cível"
  | "Minuta de acordo extrajudicial"
  | "Parecer jurídico"
  // ── Recursos Cíveis ───────────────────────────────────────────────────────
  | "Apelação cível"
  | "Recurso especial cível"
  | "Recurso"
  | "Agravo de instrumento"
  | "Agravo interno"
  | "Embargos de declaração"
  | "Agravo em recurso especial"
  | "Recurso extraordinário"
  | "Embargos de divergência"
  // ── Execução Cível ────────────────────────────────────────────────────────
  | "Embargos à execução"
  | "Exceção de pré-executividade"
  | "Impugnação ao cumprimento de sentença"
  | "Embargos de terceiro"
  // ── Writs ─────────────────────────────────────────────────────────────────
  | "Mandado de segurança"
  | "Habeas corpus"
  | "Habeas data"
  | "Mandado de injunção"
  // ── Agrário / Agronegócio ─────────────────────────────────────────────────
  | "Petição agrária (geral)"
  | "Ação de reintegração de posse rural"
  | "Ação possessória rural — interdito proibitório"
  | "Ação de usucapião rural"
  | "Ação demarcatória rural"
  | "Embargos à execução — cédula de crédito rural"
  | "Exceção de pré-executividade — crédito rural"
  | "Contestação — contrato bancário rural"
  | "Impenhorabilidade — pequena propriedade rural"
  | "Recurso agrário"
  // ── Trabalhista ───────────────────────────────────────────────────────────
  | "Reclamação trabalhista"
  | "Defesa trabalhista (contestação)"
  | "Recurso ordinário trabalhista"
  | "Recurso de revista (TST)"
  | "Agravo de instrumento (AIRR)"
  | "Embargos de declaração (TST)"
  | "Mandado de segurança trabalhista"
  // ── Tributário ────────────────────────────────────────────────────────────
  | "Mandado de segurança tributário"
  | "Ação anulatória de débito fiscal"
  | "Ação declaratória tributária"
  | "Impugnação administrativa — defesa fiscal"
  | "Recurso administrativo tributário"
  | "Ação de repetição de indébito"
  // ── Criminal ──────────────────────────────────────────────────────────────
  | "Habeas corpus criminal"
  | "Alegações finais — defesa criminal"
  | "Apelação criminal"
  | "Recurso em sentido estrito"
  | "Revisão criminal"
  | "Embargos de declaração (criminal)"
  // ── Família ───────────────────────────────────────────────────────────────
  | "Petição — divórcio"
  | "Petição — guarda e alimentos"
  | "Contestação — ação de família"
  | "Acordo extrajudicial — família"
  // ── Consumidor ────────────────────────────────────────────────────────────
  | "Petição — ação consumerista"
  | "Contestação — ação consumerista";

/**
 * Todos os tipos de peça em um array ordenado por grupo.
 * Use como fonte única para listarTiposPeca() — evita duplicação.
 */
export const TODOS_TIPOS_PECA: TipoPeca[] = [
  // Cível Geral
  "Petição inicial", "Contestação", "Réplica", "Reconvenção", "Manifestação",
  "Impugnação", "Contrarrazões", "Pedido de tutela de urgência",
  "Pedido de tutela antecipada antecedente", "Notificação extrajudicial",
  "Interpelação judicial", "Memoriais", "Alegações finais — cível",
  "Minuta de acordo extrajudicial", "Parecer jurídico",
  // Recursos Cíveis
  "Apelação cível", "Recurso especial cível", "Recurso",
  "Agravo de instrumento", "Agravo interno", "Embargos de declaração",
  "Agravo em recurso especial", "Recurso extraordinário", "Embargos de divergência",
  // Execução Cível
  "Embargos à execução", "Exceção de pré-executividade",
  "Impugnação ao cumprimento de sentença", "Embargos de terceiro",
  // Writs
  "Mandado de segurança", "Habeas corpus", "Habeas data", "Mandado de injunção",
  // Agrário / Agronegócio
  "Petição agrária (geral)", "Ação de reintegração de posse rural",
  "Ação possessória rural — interdito proibitório", "Ação de usucapião rural",
  "Ação demarcatória rural", "Embargos à execução — cédula de crédito rural",
  "Exceção de pré-executividade — crédito rural", "Contestação — contrato bancário rural",
  "Impenhorabilidade — pequena propriedade rural", "Recurso agrário",
  // Trabalhista
  "Reclamação trabalhista", "Defesa trabalhista (contestação)",
  "Recurso ordinário trabalhista", "Recurso de revista (TST)",
  "Agravo de instrumento (AIRR)", "Embargos de declaração (TST)",
  "Mandado de segurança trabalhista",
  // Tributário
  "Mandado de segurança tributário", "Ação anulatória de débito fiscal",
  "Ação declaratória tributária", "Impugnação administrativa — defesa fiscal",
  "Recurso administrativo tributário", "Ação de repetição de indébito",
  // Criminal
  "Habeas corpus criminal", "Alegações finais — defesa criminal",
  "Apelação criminal", "Recurso em sentido estrito", "Revisão criminal",
  "Embargos de declaração (criminal)",
  // Família
  "Petição — divórcio", "Petição — guarda e alimentos",
  "Contestação — ação de família", "Acordo extrajudicial — família",
  // Consumidor
  "Petição — ação consumerista", "Contestação — ação consumerista",
];

/** Grupo de exibição de cada tipo de peça (para optgroup no select). */
export const GRUPO_TIPO_PECA: Record<TipoPeca, string> = {
  // Cível Geral
  "Petição inicial": "Cível Geral",
  "Contestação": "Cível Geral",
  "Réplica": "Cível Geral",
  "Reconvenção": "Cível Geral",
  "Manifestação": "Cível Geral",
  "Impugnação": "Cível Geral",
  "Contrarrazões": "Cível Geral",
  "Pedido de tutela de urgência": "Cível Geral",
  "Pedido de tutela antecipada antecedente": "Cível Geral",
  "Notificação extrajudicial": "Cível Geral",
  "Interpelação judicial": "Cível Geral",
  "Memoriais": "Cível Geral",
  "Alegações finais — cível": "Cível Geral",
  "Minuta de acordo extrajudicial": "Cível Geral",
  "Parecer jurídico": "Cível Geral",
  // Recursos Cíveis
  "Apelação cível": "Recursos Cíveis",
  "Recurso especial cível": "Recursos Cíveis",
  "Recurso": "Recursos Cíveis",
  "Agravo de instrumento": "Recursos Cíveis",
  "Agravo interno": "Recursos Cíveis",
  "Embargos de declaração": "Recursos Cíveis",
  "Agravo em recurso especial": "Recursos Cíveis",
  "Recurso extraordinário": "Recursos Cíveis",
  "Embargos de divergência": "Recursos Cíveis",
  // Execução Cível
  "Embargos à execução": "Execução Cível",
  "Exceção de pré-executividade": "Execução Cível",
  "Impugnação ao cumprimento de sentença": "Execução Cível",
  "Embargos de terceiro": "Execução Cível",
  // Writs
  "Mandado de segurança": "Writs Constitucionais",
  "Habeas corpus": "Writs Constitucionais",
  "Habeas data": "Writs Constitucionais",
  "Mandado de injunção": "Writs Constitucionais",
  // Agrário
  "Petição agrária (geral)": "Agrário / Agronegócio",
  "Ação de reintegração de posse rural": "Agrário / Agronegócio",
  "Ação possessória rural — interdito proibitório": "Agrário / Agronegócio",
  "Ação de usucapião rural": "Agrário / Agronegócio",
  "Ação demarcatória rural": "Agrário / Agronegócio",
  "Embargos à execução — cédula de crédito rural": "Agrário / Agronegócio",
  "Exceção de pré-executividade — crédito rural": "Agrário / Agronegócio",
  "Contestação — contrato bancário rural": "Agrário / Agronegócio",
  "Impenhorabilidade — pequena propriedade rural": "Agrário / Agronegócio",
  "Recurso agrário": "Agrário / Agronegócio",
  // Trabalhista
  "Reclamação trabalhista": "Trabalhista",
  "Defesa trabalhista (contestação)": "Trabalhista",
  "Recurso ordinário trabalhista": "Trabalhista",
  "Recurso de revista (TST)": "Trabalhista",
  "Agravo de instrumento (AIRR)": "Trabalhista",
  "Embargos de declaração (TST)": "Trabalhista",
  "Mandado de segurança trabalhista": "Trabalhista",
  // Tributário
  "Mandado de segurança tributário": "Tributário",
  "Ação anulatória de débito fiscal": "Tributário",
  "Ação declaratória tributária": "Tributário",
  "Impugnação administrativa — defesa fiscal": "Tributário",
  "Recurso administrativo tributário": "Tributário",
  "Ação de repetição de indébito": "Tributário",
  // Criminal
  "Habeas corpus criminal": "Criminal",
  "Alegações finais — defesa criminal": "Criminal",
  "Apelação criminal": "Criminal",
  "Recurso em sentido estrito": "Criminal",
  "Revisão criminal": "Criminal",
  "Embargos de declaração (criminal)": "Criminal",
  // Família
  "Petição — divórcio": "Família",
  "Petição — guarda e alimentos": "Família",
  "Contestação — ação de família": "Família",
  "Acordo extrajudicial — família": "Família",
  // Consumidor
  "Petição — ação consumerista": "Consumidor",
  "Contestação — ação consumerista": "Consumidor",
};

/**
 * Skills especializadas vinculadas a cada tipo de peça.
 * Cada entrada lista os slugs de skills `anthropic-skills:X` relevantes.
 * null = skill genérica do pipeline (sem especialização extra).
 */
export const SKILL_VINCULADA_POR_TIPO: Partial<Record<TipoPeca, string[]>> = {
  // Recursos Cíveis
  "Apelação cível":              ["recursos-civeis"],
  "Recurso especial cível":      ["recursos-civeis"],
  "Recurso":                     ["recursos-civeis"],
  "Agravo de instrumento":       ["recursos-civeis"],
  "Agravo interno":              ["recursos-civeis"],
  "Embargos de declaração":      ["embargos-declaracao"],
  "Agravo em recurso especial":  ["recursos-civeis"],
  "Recurso extraordinário":      ["recursos-civeis"],
  "Embargos de divergência":     ["recursos-civeis"],
  // Agrário / Agronegócio
  "Petição agrária (geral)":                         ["peticoes-agrarias", "coordenador-master-agrario"],
  "Ação de reintegração de posse rural":             ["peticoes-agrarias", "estrategia-processual-agraria"],
  "Ação possessória rural — interdito proibitório":  ["peticoes-agrarias", "estrategia-processual-agraria"],
  "Ação de usucapião rural":                         ["peticoes-agrarias", "direito-agrario-avancado"],
  "Ação demarcatória rural":                         ["peticoes-agrarias", "direito-agrario-avancado"],
  "Embargos à execução — cédula de crédito rural":   ["embargos-execucao-titulos-agrarios", "peticoes-agrarias"],
  "Exceção de pré-executividade — crédito rural":    ["excecao-pre-executividade-bancaria", "peticoes-agrarias"],
  "Contestação — contrato bancário rural":           ["contestacao-contrato-bancario-rural", "analise-documental-agraria"],
  "Impenhorabilidade — pequena propriedade rural":   ["impenhorabilidade-pequena-propriedade-rural"],
  "Recurso agrário":                                 ["recursos-agrarios", "peticoes-agrarias"],
  // Execução Cível (com especialização bancária)
  "Embargos à execução":              ["embargos-execucao-titulos-agrarios", "excecao-pre-executividade-bancaria", "contratos-bancarios"],
  "Exceção de pré-executividade":     ["excecao-pre-executividade-bancaria"],
  "Impugnação ao cumprimento de sentença": ["excecao-pre-executividade-bancaria"],
  // Trabalhista
  "Embargos de declaração (TST)": ["embargos-declaracao"],
  // Criminal
  "Embargos de declaração (criminal)": ["embargos-declaracao"],
};

/** Label legível para cada skill vinculada. */
export const LABEL_SKILL: Record<string, string> = {
  "recursos-civeis":                        "Recursos Cíveis",
  "embargos-declaracao":                    "Embargos de Declaração",
  "peticoes-agrarias":                      "Petições Agrárias",
  "recursos-agrarios":                      "Recursos Agrários",
  "embargos-execucao-titulos-agrarios":     "Embargos — Títulos Agrários",
  "excecao-pre-executividade-bancaria":     "Exceção de Pré-Exec. Bancária",
  "contestacao-contrato-bancario-rural":    "Contestação Contrato Rural",
  "analise-documental-agraria":             "Análise Documental Agrária",
  "impenhorabilidade-pequena-propriedade-rural": "Impenhorabilidade Rural",
  "estrategia-processual-agraria":          "Estratégia Processual Agrária",
  "direito-agrario-avancado":               "Direito Agrário Avançado",
  "coordenador-master-agrario":             "Coordenador Master Agrário",
  "contratos-bancarios":                    "Contratos Bancários",
};

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
  // ── Cível Geral ────────────────────────────────────────────────────────────
  "Petição inicial":                     ["redigir_contestacao", "analisar_documento_adverso", "avaliar_riscos", "mapear_prazos"],
  "Contestação":                         ["analisar_documento_adverso", "redigir_replica", "extrair_fatos", "avaliar_riscos"],
  "Réplica":                             ["redigir_replica", "analisar_documento_adverso", "extrair_fatos"],
  "Reconvenção":                         ["analisar_documento_adverso", "extrair_fatos", "avaliar_riscos"],
  "Manifestação":                        ["redigir_impugnacao", "analisar_documento_adverso", "extrair_fatos"],
  "Impugnação":                          ["redigir_impugnacao", "analisar_documento_adverso", "avaliar_riscos"],
  "Contrarrazões":                       ["redigir_replica", "analisar_documento_adverso", "extrair_fatos"],
  "Pedido de tutela de urgência":        ["redigir_peticao_inicial", "extrair_fatos", "mapear_prazos", "avaliar_riscos"],
  "Pedido de tutela antecipada antecedente": ["redigir_peticao_inicial", "extrair_fatos", "mapear_prazos", "avaliar_riscos"],
  "Notificação extrajudicial":           ["redigir_peticao_avulsa", "extrair_fatos"],
  "Interpelação judicial":               ["redigir_peticao_avulsa", "extrair_fatos"],
  "Memoriais":                           ["redigir_peticao_avulsa", "extrair_fatos", "avaliar_riscos"],
  "Alegações finais — cível":            ["redigir_peticao_avulsa", "extrair_fatos", "avaliar_riscos"],
  "Minuta de acordo extrajudicial":      ["redigir_peticao_avulsa", "extrair_fatos"],
  "Parecer jurídico":                    ["avaliar_riscos", "extrair_fatos", "analisar_documento_adverso"],
  // ── Recursos Cíveis ────────────────────────────────────────────────────────
  "Apelação cível":                      ["redigir_recurso", "analisar_documento_adverso", "avaliar_riscos", "extrair_fatos"],
  "Recurso especial cível":              ["redigir_recurso", "analisar_documento_adverso", "extrair_fatos"],
  "Recurso":                             ["redigir_recurso", "analisar_documento_adverso", "avaliar_riscos"],
  "Agravo de instrumento":               ["redigir_agravo", "analisar_documento_adverso", "avaliar_riscos"],
  "Agravo interno":                      ["redigir_agravo", "analisar_documento_adverso"],
  "Embargos de declaração":              ["redigir_embargos", "analisar_documento_adverso"],
  "Agravo em recurso especial":          ["redigir_agravo", "analisar_documento_adverso", "avaliar_riscos"],
  "Recurso extraordinário":              ["redigir_recurso", "analisar_documento_adverso", "avaliar_riscos"],
  "Embargos de divergência":             ["redigir_embargos", "analisar_documento_adverso"],
  // ── Execução Cível ─────────────────────────────────────────────────────────
  "Embargos à execução":                 ["redigir_embargos", "redigir_excecao_executividade", "analisar_documento_adverso"],
  "Exceção de pré-executividade":        ["redigir_excecao_executividade", "analisar_documento_adverso", "avaliar_riscos"],
  "Impugnação ao cumprimento de sentença": ["redigir_impugnacao", "analisar_documento_adverso", "avaliar_riscos"],
  "Embargos de terceiro":                ["redigir_embargos", "analisar_documento_adverso", "avaliar_riscos"],
  // ── Writs ──────────────────────────────────────────────────────────────────
  "Mandado de segurança":                ["redigir_mandado_seguranca", "extrair_fatos", "mapear_prazos"],
  "Habeas corpus":                       ["redigir_mandado_seguranca", "extrair_fatos", "avaliar_riscos"],
  "Habeas data":                         ["redigir_mandado_seguranca", "extrair_fatos"],
  "Mandado de injunção":                 ["redigir_mandado_seguranca", "extrair_fatos"],
  // ── Agrário / Agronegócio ──────────────────────────────────────────────────
  "Petição agrária (geral)":                         ["redigir_peticao_inicial", "redigir_peticao_avulsa", "extrair_fatos", "avaliar_riscos"],
  "Ação de reintegração de posse rural":             ["redigir_peticao_inicial", "extrair_fatos", "avaliar_riscos", "mapear_prazos"],
  "Ação possessória rural — interdito proibitório":  ["redigir_peticao_inicial", "extrair_fatos", "avaliar_riscos", "mapear_prazos"],
  "Ação de usucapião rural":                         ["redigir_peticao_inicial", "extrair_fatos", "mapear_prazos"],
  "Ação demarcatória rural":                         ["redigir_peticao_inicial", "extrair_fatos"],
  "Embargos à execução — cédula de crédito rural":   ["redigir_embargos", "redigir_excecao_executividade", "analisar_documento_adverso", "avaliar_riscos"],
  "Exceção de pré-executividade — crédito rural":    ["redigir_excecao_executividade", "analisar_documento_adverso", "avaliar_riscos"],
  "Contestação — contrato bancário rural":           ["redigir_contestacao", "analisar_documento_adverso", "avaliar_riscos", "extrair_fatos"],
  "Impenhorabilidade — pequena propriedade rural":   ["redigir_peticao_avulsa", "analisar_documento_adverso", "avaliar_riscos"],
  "Recurso agrário":                                 ["redigir_recurso", "analisar_documento_adverso", "avaliar_riscos"],
  // ── Trabalhista ────────────────────────────────────────────────────────────
  "Reclamação trabalhista":              ["redigir_peticao_inicial", "extrair_fatos", "avaliar_riscos", "mapear_prazos"],
  "Defesa trabalhista (contestação)":    ["redigir_contestacao", "analisar_documento_adverso", "avaliar_riscos", "extrair_fatos"],
  "Recurso ordinário trabalhista":       ["redigir_recurso", "analisar_documento_adverso", "avaliar_riscos"],
  "Recurso de revista (TST)":            ["redigir_recurso", "analisar_documento_adverso"],
  "Agravo de instrumento (AIRR)":        ["redigir_agravo", "analisar_documento_adverso"],
  "Embargos de declaração (TST)":        ["redigir_embargos", "analisar_documento_adverso"],
  "Mandado de segurança trabalhista":    ["redigir_mandado_seguranca", "extrair_fatos", "mapear_prazos"],
  // ── Tributário ─────────────────────────────────────────────────────────────
  "Mandado de segurança tributário":     ["redigir_mandado_seguranca", "extrair_fatos", "mapear_prazos"],
  "Ação anulatória de débito fiscal":    ["redigir_peticao_inicial", "extrair_fatos", "avaliar_riscos"],
  "Ação declaratória tributária":        ["redigir_peticao_inicial", "extrair_fatos"],
  "Impugnação administrativa — defesa fiscal": ["redigir_contestacao", "analisar_documento_adverso", "avaliar_riscos"],
  "Recurso administrativo tributário":   ["redigir_recurso", "analisar_documento_adverso"],
  "Ação de repetição de indébito":       ["redigir_peticao_inicial", "extrair_fatos", "mapear_prazos"],
  // ── Criminal ───────────────────────────────────────────────────────────────
  "Habeas corpus criminal":              ["redigir_mandado_seguranca", "extrair_fatos", "avaliar_riscos", "mapear_prazos"],
  "Alegações finais — defesa criminal":  ["redigir_peticao_avulsa", "extrair_fatos", "avaliar_riscos"],
  "Apelação criminal":                   ["redigir_recurso", "analisar_documento_adverso", "avaliar_riscos"],
  "Recurso em sentido estrito":          ["redigir_recurso", "analisar_documento_adverso"],
  "Revisão criminal":                    ["redigir_peticao_avulsa", "extrair_fatos", "avaliar_riscos"],
  "Embargos de declaração (criminal)":   ["redigir_embargos", "analisar_documento_adverso"],
  // ── Família ────────────────────────────────────────────────────────────────
  "Petição — divórcio":                  ["redigir_peticao_inicial", "extrair_fatos", "mapear_prazos"],
  "Petição — guarda e alimentos":        ["redigir_peticao_inicial", "extrair_fatos", "avaliar_riscos"],
  "Contestação — ação de família":       ["redigir_contestacao", "analisar_documento_adverso", "avaliar_riscos"],
  "Acordo extrajudicial — família":      ["redigir_peticao_avulsa", "extrair_fatos"],
  // ── Consumidor ─────────────────────────────────────────────────────────────
  "Petição — ação consumerista":         ["redigir_peticao_inicial", "extrair_fatos", "avaliar_riscos", "mapear_prazos"],
  "Contestação — ação consumerista":     ["redigir_contestacao", "analisar_documento_adverso", "avaliar_riscos"],
  // ── fallback ───────────────────────────────────────────────────────────────
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

export type OrigemTeseJuridica = "ia" | "usuario";

export type StatusValidacaoTese = "pendente" | "aprovada" | "rejeitada" | "ajustada";

export interface TeseJuridicaPedido {
  id: string;
  titulo: string;
  descricao: string;
  fundamentos: string[];
  documentosRelacionados: string[];
  origem: OrigemTeseJuridica;
  statusValidacao: StatusValidacaoTese;
  observacoesHumanas?: string;
  confirmadaPor?: string;
  confirmadaEm?: string;
}

export type GrauCoberturaFatoProva = "forte" | "moderada" | "fraca";

export interface BriefingJuridicoPedido {
  pedidoId: string;
  casoId: string;
  tituloPedido?: string;
  tipoPeca?: string;
  statusPedido?: StatusPedido;
  prioridade?: PrioridadePedido;
  totalDocumentos: number;
  totalReferenciasDocumentais: number;
  resumoExecutivo: string;
}

export interface ContextoDoCasoPedido {
  fatosRelevantes: string[];
  cronologia: Array<{ data: string; descricao: string; documentoId?: string }>;
  pontosControvertidos: string[];
}

export interface LeituraDocumentalEstruturadaPedido {
  totalDocumentos: number;
  documentosLidos: number;
  coberturaLeitura: number;
  documentosChave: Array<{ documentoId: string; titulo: string; tipoDocumento: string }>;
  referenciasDocumentais: ReferenciaDocumentalContexto[];
  lacunasDocumentais: string[];
}

export interface MatrizFatoProvaItem {
  id: string;
  fato: string;
  provasRelacionadas: Array<{ documentoId: string; titulo: string; tipoDocumento: string }>;
  grauCobertura: GrauCoberturaFatoProva;
  controverso: boolean;
}

export interface AnaliseAdversaEstruturadaPedido {
  pontosFortes: string[];
  vulnerabilidades: string[];
  argumentosAdversos: string[];
  riscosProcessuais: string[];
  nivelRiscoGeral: "baixo" | "medio" | "alto" | "indefinido";
  observacoes: string;
}

export interface DiagnosticoEstrategicoPedido {
  resumo: string;
  diretrizPrincipal: string;
  alavancas: string[];
  fragilidades: string[];
  pendencias: string[];
}

export interface EstrategiaAprovadaPedido {
  liberadaParaEstruturacao: boolean;
  resumo: string;
  tesesConfirmadas: Array<{
    id: string;
    titulo: string;
    statusValidacao: Extract<StatusValidacaoTese, "aprovada" | "ajustada">;
  }>;
}

export interface EstruturaDaPecaPedido {
  secoesSugeridas: string[];
  pedidosPrioritarios: string[];
  provasPrioritarias: string[];
  observacoesDeRedacao: string[];
}

export interface AuditoriaJuridicaPedido {
  versaoContexto: number;
  validacaoHumanaTesesPendente: boolean;
  fontesSnapshot: Array<{ etapa: EtapaPipeline; versao: number }>;
  atualizadoEm?: string;
}

export interface DossieJuridicoPedido {
  briefingJuridico: BriefingJuridicoPedido;
  contextoDoCaso: ContextoDoCasoPedido;
  leituraDocumentalEstruturada: LeituraDocumentalEstruturadaPedido;
  matrizFatosEProvas: MatrizFatoProvaItem[];
  analiseAdversa: AnaliseAdversaEstruturadaPedido;
  diagnosticoEstrategico: DiagnosticoEstrategicoPedido;
  tesesCandidatas: TeseJuridicaPedido[];
  estrategiaAprovada: EstrategiaAprovadaPedido;
  estruturaDaPeca: EstruturaDaPecaPedido;
  auditoria: AuditoriaJuridicaPedido;
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
  teses: TeseJuridicaPedido[];
  validacaoHumanaTesesPendente: boolean;
  fontesSnapshot: Array<{ etapa: EtapaPipeline; versao: number }>;
  dossieJuridico?: DossieJuridicoPedido;
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
  responsavel?: string;
  /** Objetivo processual explícito: o que o agente deve fazer com este pedido */
  intencaoProcessual?: IntencaoProcessual;
  /** Descrição livre quando intencaoProcessual === 'outro' */
  intencaoCustom?: string;
  /** ID do documento que motivou a criação do pedido */
  documentoOrigemId?: string;
}

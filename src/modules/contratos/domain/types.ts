// ─────────────────────────────────────────────────────────────
// MÓDULO CONTRATOS — Domain Types
// ─────────────────────────────────────────────────────────────

export type TipoContrato =
  | "prestacao_servicos"
  | "arrendamento_rural"
  | "parceria_agricola"
  | "compra_venda"
  | "locacao"
  | "comodato"
  | "confissao_divida"
  | "cessao_direitos"
  | "honorarios_advocaticios"
  | "nda_confidencialidade"
  | "society_constituicao"
  | "empreitada"
  | "representacao_comercial"
  | "joint_venture"
  | "acordo_acionistas"
  | "licenciamento_software"
  | "financiamento_rural"
  | "cedula_produto_rural"
  | "penhor_rural"
  | "outro";

export const LABEL_TIPO_CONTRATO: Record<TipoContrato, string> = {
  prestacao_servicos: "Prestação de Serviços",
  arrendamento_rural: "Arrendamento Rural",
  parceria_agricola: "Parceria Agrícola",
  compra_venda: "Compra e Venda",
  locacao: "Locação",
  comodato: "Comodato",
  confissao_divida: "Confissão de Dívida",
  cessao_direitos: "Cessão de Direitos",
  honorarios_advocaticios: "Contrato de Honorários Advocatícios",
  nda_confidencialidade: "NDA / Confidencialidade",
  society_constituicao: "Constituição de Sociedade",
  empreitada: "Empreitada",
  representacao_comercial: "Representação Comercial",
  joint_venture: "Joint Venture",
  acordo_acionistas: "Acordo de Acionistas",
  licenciamento_software: "Licenciamento de Software",
  financiamento_rural: "Financiamento Rural (CCR)",
  cedula_produto_rural: "Cédula de Produto Rural (CPR)",
  penhor_rural: "Penhor Rural / Agrícola",
  outro: "Outro",
};

export type StatusContrato =
  | "rascunho"
  | "em_revisao"
  | "aprovado"
  | "assinado"
  | "vigente"
  | "encerrado"
  | "rescindido";

export const LABEL_STATUS_CONTRATO: Record<StatusContrato, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em Revisão",
  aprovado: "Aprovado",
  assinado: "Assinado",
  vigente: "Vigente",
  encerrado: "Encerrado",
  rescindido: "Rescindido",
};

export const STATUS_CONTRATO_COR: Record<StatusContrato, string> = {
  rascunho: "bg-gray-100 text-gray-600 border-gray-200",
  em_revisao: "bg-amber-100 text-amber-800 border-amber-200",
  aprovado: "bg-blue-100 text-blue-800 border-blue-200",
  assinado: "bg-violet-100 text-violet-800 border-violet-200",
  vigente: "bg-emerald-100 text-emerald-800 border-emerald-200",
  encerrado: "bg-gray-200 text-gray-500 border-gray-300",
  rescindido: "bg-rose-100 text-rose-800 border-rose-200",
};

// ─── Cláusula ──────────────────────────────────────────────────

export type TipoClausula = "essencial" | "negociavel" | "opcional" | "proibida";

export interface Clausula {
  id: string;
  numero: number;
  titulo: string;
  conteudo: string;
  tipo: TipoClausula;
  risco?: "alto" | "medio" | "baixo"; // preenchido pelo agente de análise
}

// ─── Parte do contrato ─────────────────────────────────────────

export interface ParteContrato {
  papel: "contratante" | "contratado" | "locador" | "locatario" | "arrendador" | "arrendatario" | "cedente" | "cessionario" | "outro";
  nome: string;
  cpfCnpj?: string;
  qualificacao?: string; // "pessoa física, brasileiro, casado, advogado..."
}

// ─── Versão do contrato ────────────────────────────────────────

export interface VersaoContrato {
  id: string;
  numero: number;
  autorNome: string;
  resumoMudancas: string;
  conteudo: string;
  criadoEm: string;
}

// ─── Entity principal ──────────────────────────────────────────

export interface Contrato {
  id: string;
  casoId?: string;        // vínculo com caso processual, opcional
  clienteId?: string;
  titulo: string;
  tipo: TipoContrato;
  status: StatusContrato;
  objeto: string;         // descrição do objeto contratual
  partes: ParteContrato[];
  clausulas: Clausula[];
  valorReais?: number;    // em centavos
  vigenciaInicio?: string; // ISO date
  vigenciaFim?: string;
  conteudoAtual: string;  // texto corrido do contrato (para o editor)
  versoes: VersaoContrato[];
  responsavelId?: string;
  analiseRisco?: AnaliseRiscoContrato;
  criadoEm: string;
  atualizadoEm: string;
}

// ─── Análise de risco por IA ───────────────────────────────────

export interface AnaliseRiscoContrato {
  pontuacaoRisco: number; // 0-100 (0 = baixo risco, 100 = alto risco)
  nivel: "baixo" | "moderado" | "alto" | "critico";
  clausulasRisco: { clausulaId: string; titulo: string; descricaoRisco: string; nivel: "baixo" | "medio" | "alto" }[];
  clausulasAusentes: string[]; // cláusulas essenciais que estão faltando
  recomendacoes: string[];
  analisadoEm: string;
}

// ─── Payload para criação ──────────────────────────────────────

export interface NovoContratoPayload {
  titulo: string;
  tipo: TipoContrato;
  objeto: string;
  partes: ParteContrato[];
  casoId?: string;
  clienteId?: string;
  valorReais?: number;
  vigenciaInicio?: string;
  vigenciaFim?: string;
  responsavelId?: string;
}

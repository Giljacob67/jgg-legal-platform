import type {
  ChecklistJuridicoAtivoVersionado,
  TemplateJuridicoAtivoVersionado,
  TeseJuridicaAtivaVersionada,
} from "@/modules/peticoes/base-juridica-viva/domain/types";
import type {
  BlocoTemplateJuridico,
  EspecializacaoTemplateMateria,
  MateriaCanonica,
  TipoPecaCanonica,
} from "@/modules/peticoes/domain/geracao-minuta";

const DATA_BASE_PADRAO = "2026-04-02T00:00:00.000Z";

const BLOCOS_PADRAO: BlocoTemplateJuridico[] = [
  { id: "cabecalho", titulo: "Cabeçalho", orientacaoBase: "Endereçamento e identificação da peça." },
  {
    id: "qualificacao_identificacao",
    titulo: "Qualificação e identificação",
    orientacaoBase: "Qualificação das partes e identificação do caso.",
  },
  {
    id: "sintese_fatica",
    titulo: "Síntese fática",
    orientacaoBase: "Cronologia objetiva dos fatos relevantes com suporte documental.",
  },
  {
    id: "fundamentos",
    titulo: "Fundamentos",
    orientacaoBase: "Fundamentação jurídica alinhada à estratégia consolidada.",
  },
  {
    id: "pedidos",
    titulo: "Pedidos",
    orientacaoBase: "Pedidos coerentes com a tese e o acervo documental.",
  },
  {
    id: "fechamento",
    titulo: "Fechamento",
    orientacaoBase: "Requerimentos finais, local e data.",
  },
];

const ESPECIALIZACAO_POR_MATERIA: Record<MateriaCanonica, EspecializacaoTemplateMateria> = {
  civel: {
    diretrizFundamentos: "Priorizar estrutura clássica de responsabilidade, inadimplemento e tutela jurisdicional adequada.",
    diretrizPedidos: "Manter pedidos certos, determinados e compatíveis com tutela de urgência quando cabível.",
    termosPreferenciais: ["responsabilidade civil", "inadimplemento", "ônus probatório"],
  },
  agrario_agronegocio: {
    diretrizFundamentos:
      "Enfatizar dinâmica produtiva, sazonalidade, cadeia de suprimentos e impactos operacionais no campo.",
    diretrizPedidos:
      "Incluir providências para preservar atividade produtiva, fluxo logístico e equilíbrio contratual no agronegócio.",
    termosPreferenciais: ["safra", "insumo", "cadeia produtiva", "atividade rural"],
  },
  bancario: {
    diretrizFundamentos:
      "Destacar relação contratual financeira, boa-fé objetiva, dever de informação e regularidade de encargos.",
    diretrizPedidos:
      "Precisar revisão de encargos, exibição de evolução contratual e eventuais medidas de urgência contra negativação indevida.",
    termosPreferenciais: ["encargos", "capitalização", "boa-fé objetiva", "transparência contratual"],
  },
};

function templatePadrao(input: {
  id: string;
  codigo: string;
  nome: string;
  tipoPeca: TipoPecaCanonica;
  fundamentos: string[];
  pedidos: string[];
}): TemplateJuridicoAtivoVersionado {
  return {
    id: input.id,
    codigo: input.codigo,
    tipo: "template",
    nome: input.nome,
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: [input.tipoPeca],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    blocos: BLOCOS_PADRAO,
    clausulasBase: {
      fundamentos: input.fundamentos,
      pedidos: input.pedidos,
    },
    especializacaoPorMateria: ESPECIALIZACAO_POR_MATERIA,
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  };
}

const TEMPLATES_PADRAO: TemplateJuridicoAtivoVersionado[] = [
  templatePadrao({
    id: "tpl-peticao-inicial-v1",
    codigo: "tpl-peticao-inicial",
    nome: "Template Petição Inicial",
    tipoPeca: "peticao_inicial",
    fundamentos: [
      "Expor competência, legitimidade e interesse processual com base nos elementos do caso.",
      "Demonstrar probabilidade do direito e risco de dano para tutela de urgência, quando aplicável.",
    ],
    pedidos: [
      "Recebimento da petição inicial e citação da parte ré.",
      "Procedência integral dos pedidos com condenação principal e consectários legais.",
    ],
  }),
  templatePadrao({
    id: "tpl-contestacao-v1",
    codigo: "tpl-contestacao",
    nome: "Template Contestação",
    tipoPeca: "contestacao",
    fundamentos: [
      "Organizar preliminares processuais antes da impugnação de mérito.",
      "Rebater fatos constitutivos com contraprova documental e inconsistências narrativas.",
    ],
    pedidos: [
      "Acolhimento das preliminares suscitadas, quando pertinentes.",
      "Improcedência dos pedidos iniciais e condenação da parte autora em ônus sucumbenciais.",
    ],
  }),
  templatePadrao({
    id: "tpl-manifestacao-v1",
    codigo: "tpl-manifestacao",
    nome: "Template Manifestação",
    tipoPeca: "manifestacao",
    fundamentos: [
      "Responder objetivamente aos pontos determinados em despacho ou decisão.",
      "Conectar cada argumento às referências documentais consolidadas no contexto.",
    ],
    pedidos: [
      "Recebimento da manifestação para os fins processuais cabíveis.",
      "Adoção das providências requeridas ao final da peça.",
    ],
  }),
  templatePadrao({
    id: "tpl-embargos-execucao-v1",
    codigo: "tpl-embargos-execucao",
    nome: "Template Embargos à Execução",
    tipoPeca: "embargos_execucao",
    fundamentos: [
      "Delimitar excesso, inexigibilidade ou nulidade da execução com memória de cálculo e documentos.",
      "Apresentar impugnação técnica dos títulos e encargos executados.",
    ],
    pedidos: [
      "Recebimento e processamento dos embargos à execução.",
      "Reconhecimento da inexigibilidade total ou parcial e adequação dos valores executados.",
    ],
  }),
  templatePadrao({
    id: "tpl-apelacao-civel-v1",
    codigo: "tpl-apelacao-civel",
    nome: "Template Apelação Cível",
    tipoPeca: "apelacao_civel",
    fundamentos: [
      "Demonstrar error in judicando e/ou error in procedendo de forma segmentada.",
      "Evidenciar violação ao conjunto probatório e ao enquadramento jurídico adotado na sentença.",
    ],
    pedidos: [
      "Conhecimento e provimento do recurso para reforma integral ou parcial da sentença.",
      "Redistribuição dos ônus sucumbenciais conforme resultado recursal.",
    ],
  }),
  templatePadrao({
    id: "tpl-recurso-especial-civel-v1",
    codigo: "tpl-recurso-especial-civel",
    nome: "Template Recurso Especial Cível",
    tipoPeca: "recurso_especial_civel",
    fundamentos: [
      "Indicar violação direta de dispositivo federal e o prequestionamento correspondente.",
      "Estruturar demonstração analítica de divergência jurisprudencial quando aplicável.",
    ],
    pedidos: [
      "Admissão do recurso especial por preenchimento dos pressupostos legais.",
      "Provimento para adequação do acórdão recorrido ao entendimento da legislação federal.",
    ],
  }),
];

const TESES_PADRAO: TeseJuridicaAtivaVersionada[] = [
  {
    id: "tese-civ-001-v1",
    codigo: "TES-CIV-001",
    tipo: "tese",
    titulo: "Tutela de urgência por risco de dano contratual contínuo",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "manifestacao"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    palavrasChave: ["tutela de urgência", "risco", "inadimplemento", "probabilidade do direito"],
    gatilhos: [
      { id: "GAT-CIV-001", tipo: "estrategia", valor: "risco", peso: 5 },
      { id: "GAT-CIV-002", tipo: "ponto_controvertido", valor: "inadimplemento", peso: 4 },
      { id: "GAT-CIV-003", tipo: "padrao_textual", valor: "tutela", peso: 3 },
      { id: "GAT-CIV-004", tipo: "referencia_documental", valor: "DOC", peso: 2 },
    ],
    teseBase: "A urgência é justificada pelo dano progressivo e pela plausibilidade documental da narrativa fática.",
    fundamentoSintetico: "Art. 300 do CPC e princípio da efetividade da tutela jurisdicional.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "tese-civ-002-v1",
    codigo: "TES-CIV-002",
    tipo: "tese",
    titulo: "Responsabilidade por descumprimento contratual com prova documental",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "apelacao_civel"],
    materias: ["civel", "agrario_agronegocio"],
    palavrasChave: ["descumprimento", "cláusula", "multa", "prova documental"],
    gatilhos: [
      { id: "GAT-CIV-005", tipo: "ponto_controvertido", valor: "descumpr", peso: 4 },
      { id: "GAT-CIV-006", tipo: "referencia_documental", valor: "contrato", peso: 4 },
      { id: "GAT-CIV-007", tipo: "palavra_chave", valor: "multa", peso: 3 },
    ],
    teseBase: "A violação contratual comprovada por documentos autoriza condenação e reparação integral.",
    fundamentoSintetico: "Boa-fé objetiva e força obrigatória dos contratos.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "tese-ban-001-v1",
    codigo: "TES-BAN-001",
    tipo: "tese",
    titulo: "Revisão de encargos e transparência contratual bancária",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "embargos_execucao"],
    materias: ["bancario"],
    palavrasChave: ["encargos", "capitalização", "transparência", "boa-fé objetiva"],
    gatilhos: [
      { id: "GAT-BAN-001", tipo: "palavra_chave", valor: "encargos", peso: 4 },
      { id: "GAT-BAN-002", tipo: "estrategia", valor: "revisão", peso: 4 },
      { id: "GAT-BAN-003", tipo: "ponto_controvertido", valor: "capitalização", peso: 3 },
    ],
    teseBase: "A ausência de clareza na evolução da dívida impõe revisão dos encargos e exibição analítica.",
    fundamentoSintetico: "Dever de informação e vedação de vantagem excessiva.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "tese-agr-001-v1",
    codigo: "TES-AGR-001",
    tipo: "tese",
    titulo: "Preservação da atividade produtiva no agronegócio",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "manifestacao", "apelacao_civel"],
    materias: ["agrario_agronegocio"],
    palavrasChave: ["safra", "atividade rural", "insumo", "cadeia produtiva"],
    gatilhos: [
      { id: "GAT-AGR-001", tipo: "palavra_chave", valor: "safra", peso: 4 },
      { id: "GAT-AGR-002", tipo: "estrategia", valor: "atividade produtiva", peso: 4 },
      { id: "GAT-AGR-003", tipo: "ponto_controvertido", valor: "insumo", peso: 3 },
    ],
    teseBase: "A tutela jurisdicional deve evitar interrupção da cadeia produtiva e perda da safra.",
    fundamentoSintetico: "Função social da atividade produtiva e proteção da continuidade do negócio rural.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "tese-def-001-v1",
    codigo: "TES-DEF-001",
    tipo: "tese",
    titulo: "Impugnação por insuficiência probatória da parte adversa",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["contestacao", "manifestacao"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    palavrasChave: ["ônus da prova", "insuficiência", "impugnação específica"],
    gatilhos: [
      { id: "GAT-DEF-001", tipo: "padrao_textual", valor: "ônus", peso: 3 },
      { id: "GAT-DEF-002", tipo: "ponto_controvertido", valor: "prova", peso: 4 },
      { id: "GAT-DEF-003", tipo: "estrategia", valor: "impugnação", peso: 3 },
    ],
    teseBase: "A narrativa adversa sem prova robusta deve ser rejeitada por ausência de suporte mínimo.",
    fundamentoSintetico: "Distribuição dinâmica/estática do ônus probatório conforme CPC.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "tese-rec-001-v1",
    codigo: "TES-REC-001",
    tipo: "tese",
    titulo: "Reforma por error in judicando com revaloração do conjunto fático",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["apelacao_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    palavrasChave: ["error in judicando", "reforma", "conjunto probatório"],
    gatilhos: [
      { id: "GAT-REC-001", tipo: "padrao_textual", valor: "reforma", peso: 4 },
      { id: "GAT-REC-002", tipo: "ponto_controvertido", valor: "sentença", peso: 3 },
      { id: "GAT-REC-003", tipo: "estrategia", valor: "recurso", peso: 3 },
    ],
    teseBase: "A sentença deve ser reformada quando dissociada da prova documental e dos fatos incontroversos.",
    fundamentoSintetico: "Controle de legalidade e correção do julgamento em segundo grau.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "tese-esp-001-v1",
    codigo: "TES-ESP-001",
    tipo: "tese",
    titulo: "Violação de dispositivo federal e prequestionamento",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["recurso_especial_civel"],
    materias: ["civel", "bancario"],
    palavrasChave: ["dispositivo federal", "prequestionamento", "recurso especial"],
    gatilhos: [
      { id: "GAT-ESP-001", tipo: "padrao_textual", valor: "dispositivo federal", peso: 5 },
      { id: "GAT-ESP-002", tipo: "padrao_textual", valor: "prequestionamento", peso: 4 },
      { id: "GAT-ESP-003", tipo: "estrategia", valor: "recurso especial", peso: 3 },
    ],
    teseBase: "A admissibilidade recursal depende da demonstração analítica de violação legal e prequestionamento.",
    fundamentoSintetico: "Pressupostos de admissibilidade do recurso especial.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "tese-emb-001-v1",
    codigo: "TES-EMB-001",
    tipo: "tese",
    titulo: "Excesso de execução e inexigibilidade parcial",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["embargos_execucao"],
    materias: ["civel", "bancario"],
    palavrasChave: ["excesso de execução", "inexigibilidade", "memória de cálculo"],
    gatilhos: [
      { id: "GAT-EMB-001", tipo: "palavra_chave", valor: "excesso", peso: 4 },
      { id: "GAT-EMB-002", tipo: "palavra_chave", valor: "inexigibilidade", peso: 4 },
      { id: "GAT-EMB-003", tipo: "referencia_documental", valor: "cálculo", peso: 3 },
    ],
    teseBase: "A execução deve ser limitada ao valor efetivamente exigível, com abatimento de parcelas indevidas.",
    fundamentoSintetico: "Devido processo executivo e liquidez estrita do título.",
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
];

const CHECKLISTS_PADRAO: ChecklistJuridicoAtivoVersionado[] = [
  {
    id: "checklist-obr-001-v1",
    codigo: "CHK-OBR-001",
    tipo: "checklist",
    descricao: "Qualificação das partes está explícita.",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "manifestacao", "embargos_execucao", "apelacao_civel", "recurso_especial_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    categoria: "obrigatorio",
    blocoEsperado: "qualificacao_identificacao",
    tokensEsperados: ["partes", "cliente", "caso"],
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "checklist-obr-002-v1",
    codigo: "CHK-OBR-002",
    tipo: "checklist",
    descricao: "Síntese fática contém narrativa objetiva.",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "manifestacao", "embargos_execucao", "apelacao_civel", "recurso_especial_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    categoria: "obrigatorio",
    blocoEsperado: "sintese_fatica",
    tokensEsperados: ["fatos", "cronologia", "evento"],
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "checklist-obr-003-v1",
    codigo: "CHK-OBR-003",
    tipo: "checklist",
    descricao: "Fundamentos jurídicos foram estruturados.",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "manifestacao", "embargos_execucao", "apelacao_civel", "recurso_especial_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    categoria: "obrigatorio",
    blocoEsperado: "fundamentos",
    tokensEsperados: ["fundamento", "estratégia", "juríd"],
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "checklist-obr-004-v1",
    codigo: "CHK-OBR-004",
    tipo: "checklist",
    descricao: "Pedidos estão claros e determinados.",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "manifestacao", "embargos_execucao", "apelacao_civel", "recurso_especial_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    categoria: "obrigatorio",
    blocoEsperado: "pedidos",
    tokensEsperados: ["pedido", "requer", "procedência", "improcedência"],
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "checklist-rec-001-v1",
    codigo: "CHK-REC-001",
    tipo: "checklist",
    descricao: "Referências documentais aparecem nos fundamentos ou pedidos.",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "manifestacao", "embargos_execucao", "apelacao_civel", "recurso_especial_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    categoria: "recomendavel",
    blocoEsperado: "geral",
    tokensEsperados: ["DOC-", "documento", "referência"],
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "checklist-rec-002-v1",
    codigo: "CHK-REC-002",
    tipo: "checklist",
    descricao: "Fechamento processual com fórmula final adequada.",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["peticao_inicial", "contestacao", "manifestacao", "embargos_execucao", "apelacao_civel", "recurso_especial_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    categoria: "recomendavel",
    blocoEsperado: "fechamento",
    tokensEsperados: ["pede deferimento", "termos em que"],
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
  {
    id: "checklist-rec-003-v1",
    codigo: "CHK-REC-003",
    tipo: "checklist",
    descricao: "Peça recursal explicita pedido de reforma/admissibilidade.",
    versao: 1,
    status: "ativo",
    tiposPecaCanonica: ["apelacao_civel", "recurso_especial_civel"],
    materias: ["civel", "agrario_agronegocio", "bancario"],
    categoria: "recomendavel",
    blocoEsperado: "pedidos",
    tokensEsperados: ["reforma", "admissão", "provimento"],
    criadoEm: DATA_BASE_PADRAO,
    atualizadoEm: DATA_BASE_PADRAO,
  },
];

export function criarTemplatesJuridicosPadrao(): TemplateJuridicoAtivoVersionado[] {
  return structuredClone(TEMPLATES_PADRAO);
}

export function criarTesesJuridicasPadrao(): TeseJuridicaAtivaVersionada[] {
  return structuredClone(TESES_PADRAO);
}

export function criarChecklistsJuridicosPadrao(): ChecklistJuridicoAtivoVersionado[] {
  return structuredClone(CHECKLISTS_PADRAO);
}

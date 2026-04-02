import type {
  BlocoTemplateJuridico,
  EspecializacaoTemplateMateria,
  MateriaCanonica,
  TemplateJuridicoVersionado,
  TipoPecaCanonica,
} from "@/modules/peticoes/domain/geracao-minuta";

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

function criarTemplate(input: {
  id: string;
  nome: string;
  tipoPecaCanonica: TipoPecaCanonica;
  versao: number;
  fundamentos: string[];
  pedidos: string[];
}): TemplateJuridicoVersionado {
  return {
    id: input.id,
    nome: input.nome,
    tipoPecaCanonica: input.tipoPecaCanonica,
    versao: input.versao,
    ativo: true,
    blocos: BLOCOS_PADRAO,
    clausulasBase: {
      fundamentos: input.fundamentos,
      pedidos: input.pedidos,
    },
    especializacaoPorMateria: ESPECIALIZACAO_POR_MATERIA,
  };
}

const TEMPLATES_JURIDICOS: TemplateJuridicoVersionado[] = [
  criarTemplate({
    id: "tpl-peticao-inicial-v1",
    nome: "Template Petição Inicial",
    tipoPecaCanonica: "peticao_inicial",
    versao: 1,
    fundamentos: [
      "Expor competência, legitimidade e interesse processual com base nos elementos do caso.",
      "Demonstrar probabilidade do direito e risco de dano para tutela de urgência, quando aplicável.",
    ],
    pedidos: [
      "Recebimento da petição inicial e citação da parte ré.",
      "Procedência integral dos pedidos com condenação principal e consectários legais.",
    ],
  }),
  criarTemplate({
    id: "tpl-contestacao-v1",
    nome: "Template Contestação",
    tipoPecaCanonica: "contestacao",
    versao: 1,
    fundamentos: [
      "Organizar preliminares processuais antes da impugnação de mérito.",
      "Rebater fatos constitutivos com contraprova documental e inconsistências narrativas.",
    ],
    pedidos: [
      "Acolhimento das preliminares suscitadas, quando pertinentes.",
      "Improcedência dos pedidos iniciais e condenação da parte autora em ônus sucumbenciais.",
    ],
  }),
  criarTemplate({
    id: "tpl-manifestacao-v1",
    nome: "Template Manifestação",
    tipoPecaCanonica: "manifestacao",
    versao: 1,
    fundamentos: [
      "Responder objetivamente aos pontos determinados em despacho ou decisão.",
      "Conectar cada argumento às referências documentais consolidadas no contexto.",
    ],
    pedidos: [
      "Recebimento da manifestação para os fins processuais cabíveis.",
      "Adoção das providências requeridas ao final da peça.",
    ],
  }),
  criarTemplate({
    id: "tpl-embargos-execucao-v1",
    nome: "Template Embargos à Execução",
    tipoPecaCanonica: "embargos_execucao",
    versao: 1,
    fundamentos: [
      "Delimitar excesso, inexigibilidade ou nulidade da execução com memória de cálculo e documentos.",
      "Apresentar impugnação técnica dos títulos e encargos executados.",
    ],
    pedidos: [
      "Recebimento e processamento dos embargos à execução.",
      "Reconhecimento da inexigibilidade total ou parcial e adequação dos valores executados.",
    ],
  }),
  criarTemplate({
    id: "tpl-apelacao-civel-v1",
    nome: "Template Apelação Cível",
    tipoPecaCanonica: "apelacao_civel",
    versao: 1,
    fundamentos: [
      "Demonstrar error in judicando e/ou error in procedendo de forma segmentada.",
      "Evidenciar violação ao conjunto probatório e ao enquadramento jurídico adotado na sentença.",
    ],
    pedidos: [
      "Conhecimento e provimento do recurso para reforma integral ou parcial da sentença.",
      "Redistribuição dos ônus sucumbenciais conforme resultado recursal.",
    ],
  }),
  criarTemplate({
    id: "tpl-recurso-especial-civel-v1",
    nome: "Template Recurso Especial Cível",
    tipoPecaCanonica: "recurso_especial_civel",
    versao: 1,
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

export function listarTemplatesJuridicosVersionados(): TemplateJuridicoVersionado[] {
  return TEMPLATES_JURIDICOS.filter((item) => item.ativo);
}

export function obterTemplateJuridicoAtivoPorTipoPeca(tipoPecaCanonica: TipoPecaCanonica): TemplateJuridicoVersionado {
  const templates = listarTemplatesJuridicosVersionados();
  const encontrado = templates.find((item) => item.tipoPecaCanonica === tipoPecaCanonica);

  if (encontrado) {
    return encontrado;
  }

  return templates.find((item) => item.tipoPecaCanonica === "manifestacao") ?? templates[0];
}

import type { IntencaoProcessual, TipoPeca } from "@/modules/peticoes/domain/types";
import type { CategoriaObjetivoJuridico } from "@/modules/peticoes/novo-pedido/domain/types";

export interface CategoriaObjetivoMeta {
  id: CategoriaObjetivoJuridico;
  titulo: string;
  descricao: string;
  orientacao: string;
}

export interface ObjetivoJuridicoSugestao {
  intencao: IntencaoProcessual;
  titulo: string;
  descricao: string;
  tiposPecaRelacionados: TipoPeca[];
}

export const CATEGORIAS_OBJETIVO: CategoriaObjetivoMeta[] = [
  {
    id: "responder_parte_contraria",
    titulo: "Responder parte contrária",
    descricao: "Quando já existe peça, manifestação ou execução adversa exigindo resposta técnica.",
    orientacao: "Fluxo indicado para defesa, impugnação, réplica e neutralização de risco processual.",
  },
  {
    id: "iniciar_medida",
    titulo: "Iniciar medida ou ação",
    descricao: "Quando o escritório vai provocar o Judiciário ou apresentar medida principal.",
    orientacao: "Fluxo indicado para petição inicial, tutela, mandado de segurança e petições ofensivas.",
  },
  {
    id: "recorrer_decisao",
    titulo: "Recorrer de decisão",
    descricao: "Quando o objetivo é reformar, esclarecer ou atacar decisão judicial/administrativa.",
    orientacao: "Fluxo indicado para apelação, agravo, embargos e recursos em geral.",
  },
  {
    id: "analisar_cenario",
    titulo: "Analisar cenário jurídico",
    descricao: "Quando a prioridade é entender fatos, riscos, prazos e viabilidade antes de redigir.",
    orientacao: "Fluxo indicado para diagnóstico inicial, parecer e triagem de material recebido.",
  },
  {
    id: "peticao_personalizada",
    titulo: "Petição personalizada",
    descricao: "Quando a demanda foge do padrão e exige instrução livre do advogado responsável.",
    orientacao: "Fluxo indicado para pedidos avulsos, notificações e estratégias sob medida.",
  },
];

export const OBJETIVOS_POR_CATEGORIA: Record<CategoriaObjetivoJuridico, ObjetivoJuridicoSugestao[]> = {
  responder_parte_contraria: [
    {
      intencao: "redigir_contestacao",
      titulo: "Redigir contestação",
      descricao: "Responder petição inicial ou defesa equivalente com foco em refutação do mérito e preliminares.",
      tiposPecaRelacionados: ["Contestação", "Defesa trabalhista (contestação)", "Contestação — ação de família", "Contestação — ação consumerista"],
    },
    {
      intencao: "redigir_impugnacao",
      titulo: "Redigir impugnação",
      descricao: "Contrapor manifestação, cumprimento de sentença ou outro movimento já existente no processo.",
      tiposPecaRelacionados: ["Impugnação", "Impugnação ao cumprimento de sentença", "Manifestação"],
    },
    {
      intencao: "redigir_replica",
      titulo: "Redigir réplica",
      descricao: "Responder defesa já apresentada e reorganizar a narrativa do polo representado.",
      tiposPecaRelacionados: ["Réplica", "Contrarrazões"],
    },
    {
      intencao: "redigir_embargos",
      titulo: "Embargar execução",
      descricao: "Atuar defensivamente contra cobrança, execução ou cumprimento já instaurado.",
      tiposPecaRelacionados: ["Embargos à execução", "Embargos à execução — cédula de crédito rural", "Embargos de terceiro"],
    },
    {
      intencao: "redigir_excecao_executividade",
      titulo: "Arguir exceção de pré-executividade",
      descricao: "Levantar nulidades e matérias de ordem pública sem necessidade de dilação probatória ampla.",
      tiposPecaRelacionados: ["Exceção de pré-executividade", "Exceção de pré-executividade — crédito rural"],
    },
  ],
  iniciar_medida: [
    {
      intencao: "redigir_peticao_inicial",
      titulo: "Redigir petição inicial",
      descricao: "Abrir ação, estruturar causa de pedir e formular pedidos completos.",
      tiposPecaRelacionados: ["Petição inicial", "Petição agrária (geral)", "Petição — ação consumerista", "Petição — divórcio", "Petição — guarda e alimentos"],
    },
    {
      intencao: "redigir_mandado_seguranca",
      titulo: "Impetrar mandado ou medida constitucional",
      descricao: "Atuar em situação urgente com direito líquido e certo ou restrição à liberdade.",
      tiposPecaRelacionados: ["Mandado de segurança", "Mandado de segurança tributário", "Mandado de segurança trabalhista", "Habeas corpus", "Habeas corpus criminal"],
    },
    {
      intencao: "redigir_peticao_avulsa",
      titulo: "Protocolar petição avulsa",
      descricao: "Preparar pedido pontual, tutela incidental, memoriais ou notificação estratégica.",
      tiposPecaRelacionados: ["Pedido de tutela de urgência", "Pedido de tutela antecipada antecedente", "Notificação extrajudicial", "Interpelação judicial", "Memoriais"],
    },
  ],
  recorrer_decisao: [
    {
      intencao: "redigir_recurso",
      titulo: "Redigir recurso",
      descricao: "Estruturar peça recursal principal com foco em reforma de decisão.",
      tiposPecaRelacionados: ["Apelação cível", "Recurso especial cível", "Recurso", "Recurso extraordinário", "Recurso ordinário trabalhista", "Recurso administrativo tributário", "Apelação criminal"],
    },
    {
      intencao: "redigir_agravo",
      titulo: "Redigir agravo",
      descricao: "Atacar decisão interlocutória ou decisão que tranca recurso.",
      tiposPecaRelacionados: ["Agravo de instrumento", "Agravo interno", "Agravo em recurso especial", "Agravo de instrumento (AIRR)", "Recurso agrário"],
    },
    {
      intencao: "redigir_embargos",
      titulo: "Redigir embargos de declaração",
      descricao: "Sanar omissão, contradição, obscuridade ou viabilizar prequestionamento.",
      tiposPecaRelacionados: ["Embargos de declaração", "Embargos de declaração (TST)", "Embargos de declaração (criminal)", "Embargos de divergência"],
    },
  ],
  analisar_cenario: [
    {
      intencao: "analisar_documento_adverso",
      titulo: "Analisar documento adverso",
      descricao: "Mapear vulnerabilidades, premissas e estratégia do material recebido.",
      tiposPecaRelacionados: ["Manifestação", "Parecer jurídico"],
    },
    {
      intencao: "extrair_fatos",
      titulo: "Extrair fatos e cronologia",
      descricao: "Organizar narrativa e eventos relevantes antes da redação.",
      tiposPecaRelacionados: ["Manifestação", "Parecer jurídico"],
    },
    {
      intencao: "avaliar_riscos",
      titulo: "Avaliar riscos e viabilidade",
      descricao: "Levantar exposição processual, lacunas probatórias e medidas preparatórias.",
      tiposPecaRelacionados: ["Parecer jurídico", "Manifestação"],
    },
    {
      intencao: "mapear_prazos",
      titulo: "Mapear prazos processuais",
      descricao: "Identificar urgências, marcos e janelas críticas do caso.",
      tiposPecaRelacionados: ["Manifestação"],
    },
  ],
  peticao_personalizada: [
    {
      intencao: "redigir_peticao_avulsa",
      titulo: "Petição sob medida",
      descricao: "Quando a peça é específica e não se encaixa imediatamente em um fluxo padrão.",
      tiposPecaRelacionados: ["Manifestação", "Minuta de acordo extrajudicial", "Acordo extrajudicial — família", "Notificação extrajudicial"],
    },
    {
      intencao: "outro",
      titulo: "Definir objetivo livremente",
      descricao: "Permite descrever a instrução jurídica com total liberdade antes da criação do pedido.",
      tiposPecaRelacionados: ["Manifestação"],
    },
  ],
};

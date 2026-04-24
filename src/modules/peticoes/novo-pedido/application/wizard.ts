import type { Caso } from "@/modules/casos/domain/types";
import { detectarPoloRepresentado } from "@/modules/casos/domain/types";
import { CATEGORIAS_OBJETIVO, OBJETIVOS_POR_CATEGORIA, type ObjetivoJuridicoSugestao } from "@/modules/peticoes/novo-pedido/domain/catalogo";
import type {
  BriefingNovoPedido,
  DocumentoSelecionadoNovoPedido,
  EtapaNovoPedidoWizard,
  EvidenciaRevisaoNovoPedido,
  NovoPedidoWizardDraft,
  ObjetivoJuridicoNovoPedido,
  PayloadCriacaoWizard,
  PendenciaNovoPedido,
  RevisaoNovoPedido,
  SugestaoTriagemWizard,
  UrgenciaNovoPedido,
} from "@/modules/peticoes/novo-pedido/domain/types";
import type { CategoriaObjetivoJuridico, EstrategiaInicialNovoPedido } from "@/modules/peticoes/novo-pedido/domain/types";
import {
  TODOS_TIPOS_PECA,
  type IntencaoProcessual,
  type PrioridadePedido,
  type TipoPeca,
} from "@/modules/peticoes/domain/types";

function hojeNoFusoLocal(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

function calcularDiasRestantes(prazoFinal: string): number | undefined {
  if (!prazoFinal) {
    return undefined;
  }

  const prazo = new Date(`${prazoFinal}T00:00:00`);
  if (Number.isNaN(prazo.getTime())) {
    return undefined;
  }

  const diffMs = prazo.getTime() - hojeNoFusoLocal().getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function listarMetadadosCategoriasObjetivo() {
  return CATEGORIAS_OBJETIVO;
}

export function listarObjetivosPorCategoria(
  categoria: CategoriaObjetivoJuridico | null,
): ObjetivoJuridicoSugestao[] {
  if (!categoria) {
    return [];
  }

  return OBJETIVOS_POR_CATEGORIA[categoria];
}

function resumirCaso(caso: Caso | null): BriefingNovoPedido {
  return {
    casoId: caso?.id ?? "",
    tituloCaso: caso?.titulo ?? "",
    cliente: caso?.cliente ?? "",
    materia: caso?.materia ?? "",
    tribunal: caso?.tribunal ?? "",
    poloInferido: caso ? detectarPoloRepresentado(caso) : "indefinido",
    contextoFatico: "",
    observacoesOperacionais: "",
  };
}

function urgenciaBase(prazoFinal: string): UrgenciaNovoPedido {
  const diasRestantes = calcularDiasRestantes(prazoFinal);

  if (diasRestantes === undefined) {
    return {
      nivel: "moderada",
      justificativa: "Prazo ainda não informado. O sistema mantém urgência moderada até a revisão humana.",
    };
  }

  if (diasRestantes <= 1) {
    return {
      nivel: "critica",
      diasRestantes,
      justificativa: "Prazo imediato. O pedido exige confirmação rápida e definição de responsável sem atraso.",
    };
  }

  if (diasRestantes <= 3) {
    return {
      nivel: "alta",
      diasRestantes,
      justificativa: "Prazo muito próximo. Vale antecipar triagem, leitura documental e distribuição do trabalho.",
    };
  }

  if (diasRestantes <= 7) {
    return {
      nivel: "moderada",
      diasRestantes,
      justificativa: "Prazo controlado, mas ainda sensível para coleta de provas e consolidação de estratégia.",
    };
  }

  return {
    nivel: "baixa",
    diasRestantes,
    justificativa: "Prazo com folga operacional. Há espaço para validação jurídica e complementação documental.",
  };
}

export function criarDraftInicial(casos: Caso[]): NovoPedidoWizardDraft {
  const casoInicial = casos[0] ?? null;

  return {
    caso: casoInicial,
    briefing: resumirCaso(casoInicial),
    objetivo: {
      categoria: null,
      intencaoSelecionada: "",
      intencaoLivre: "",
    },
    estrategia: {
      tipoPecaSugerida: null,
      tipoPecaConfirmada: null,
      prioridadeSugerida: "média",
      prioridadeConfirmada: null,
      urgencia: urgenciaBase(casoInicial?.prazoFinal ?? ""),
      resumoInferido: "Selecione objetivo, contexto e documentos para preparar o dossiê inicial do pedido.",
      alertas: [],
      proximasProvidencias: [],
    },
    teses: [],
    documentos: [],
    pendencias: [],
    revisao: {
      inferido: [],
      confirmado: [],
      faltando: [],
    },
    confirmacao: {
      confirmadoPeloUsuario: false,
      observacoesFinais: "",
    },
  };
}

export function normalizarTipoPecaCatalogo(value: string | null | undefined): TipoPeca | null {
  if (!value) {
    return null;
  }

  return TODOS_TIPOS_PECA.includes(value as TipoPeca) ? (value as TipoPeca) : null;
}

function inferirPrioridade(urgencia: UrgenciaNovoPedido, documentos: DocumentoSelecionadoNovoPedido[]): PrioridadePedido {
  if (urgencia.nivel === "critica" || urgencia.nivel === "alta") {
    return "alta";
  }

  if (documentos.length >= 4) {
    return "alta";
  }

  if (urgencia.nivel === "moderada") {
    return "média";
  }

  return "baixa";
}

function resumirObjetivo(intencaoSelecionada: IntencaoProcessual | "", intencaoLivre: string): string {
  if (intencaoSelecionada === "outro") {
    return intencaoLivre.trim() || "Objetivo livre ainda não descrito.";
  }

  if (!intencaoSelecionada) {
    return "Objetivo jurídico ainda não confirmado.";
  }

  return intencaoSelecionada.replaceAll("_", " ");
}

function inferirTipoPeca(
  objetivo: ObjetivoJuridicoNovoPedido,
  sugestaoTriagem: SugestaoTriagemWizard | null,
): TipoPeca | null {
  const tipoTriagem = normalizarTipoPecaCatalogo(sugestaoTriagem?.tipoPecaClassificado);
  if (tipoTriagem) {
    return tipoTriagem;
  }

  if (!objetivo.categoria || !objetivo.intencaoSelecionada) {
    return null;
  }

  const sugestao = OBJETIVOS_POR_CATEGORIA[objetivo.categoria].find(
    (item) => item.intencao === objetivo.intencaoSelecionada,
  );

  return sugestao?.tiposPecaRelacionados[0] ?? null;
}

function inferirResumoEstrategia(input: {
  caso: Caso | null;
  objetivo: ObjetivoJuridicoNovoPedido;
  urgencia: UrgenciaNovoPedido;
  sugestaoTriagem: SugestaoTriagemWizard | null;
}): string {
  if (input.sugestaoTriagem?.resumoJustificativa) {
    return input.sugestaoTriagem.resumoJustificativa;
  }

  const objetivo = resumirObjetivo(input.objetivo.intencaoSelecionada, input.objetivo.intencaoLivre);
  const materia = input.caso?.materia ?? "matéria não definida";
  return `Pedido em ${materia}, com foco em ${objetivo}. A urgência atual foi classificada como ${input.urgencia.nivel} e o sistema preparará leitura documental, matriz de fatos e análise estratégica após a abertura.`;
}

function inferirProvidencias(input: {
  objetivo: ObjetivoJuridicoNovoPedido;
  documentos: DocumentoSelecionadoNovoPedido[];
  urgencia: UrgenciaNovoPedido;
  sugestaoTriagem: SugestaoTriagemWizard | null;
}): string[] {
  const providencias = new Set<string>();

  if (input.documentos.length === 0) {
    providencias.add("Solicitar ou anexar documentos-base antes de iniciar a produção da peça.");
  } else {
    providencias.add("Validar se os documentos anexados cobrem os fatos centrais antes da leitura documental estruturada.");
  }

  if (input.urgencia.nivel === "critica" || input.urgencia.nivel === "alta") {
    providencias.add("Definir responsável e janela de revisão humana imediatamente.");
  }

  if (input.objetivo.intencaoSelecionada === "analisar_documento_adverso") {
    providencias.add("Mapear vulnerabilidades do material adverso antes de escolher a peça final.");
  }

  if (input.objetivo.intencaoSelecionada === "redigir_peticao_inicial") {
    providencias.add("Confirmar pedidos, causa de pedir e prova mínima para ajuizamento.");
  }

  providencias.add("Após a abertura, executar leitura documental, matriz de fatos e provas e diagnóstico estratégico antes das teses.");

  if (input.sugestaoTriagem?.responsavelSugerido) {
    providencias.add(`Responsável sugerido para primeira passada: ${input.sugestaoTriagem.responsavelSugerido}.`);
  }

  return [...providencias];
}

function inferirAlertas(input: {
  caso: Caso | null;
  objetivo: ObjetivoJuridicoNovoPedido;
  urgencia: UrgenciaNovoPedido;
  sugestaoTriagem: SugestaoTriagemWizard | null;
  documentos: DocumentoSelecionadoNovoPedido[];
}): string[] {
  const alertas = new Set<string>(input.sugestaoTriagem?.alertas ?? []);

  if (!input.caso?.prazoFinal) {
    alertas.add("Prazo do caso não está cadastrado. Revise a urgência manualmente.");
  }

  if (input.documentos.length === 0) {
    alertas.add("Nenhum documento anexado até o momento.");
  }

  if (input.objetivo.intencaoSelecionada === "outro" && !input.objetivo.intencaoLivre.trim()) {
    alertas.add("Objetivo livre ainda não foi descrito com clareza.");
  }

  if (input.urgencia.nivel === "critica") {
    alertas.add("Urgência crítica detectada. O fluxo deve ser confirmado sem atrasos.");
  }

  return [...alertas];
}

export function consolidarEstrategiaInicial(input: {
  caso: Caso | null;
  objetivo: ObjetivoJuridicoNovoPedido;
  prazoFinal: string;
  documentos: DocumentoSelecionadoNovoPedido[];
  sugestaoTriagem: SugestaoTriagemWizard | null;
  tipoPecaConfirmada: TipoPeca | null;
  prioridadeConfirmada: PrioridadePedido | null;
}): EstrategiaInicialNovoPedido {
  const urgencia = urgenciaBase(input.prazoFinal);
  const tipoPecaSugerida = inferirTipoPeca(input.objetivo, input.sugestaoTriagem);
  const prioridadeSugerida = input.sugestaoTriagem?.prioridade ?? inferirPrioridade(urgencia, input.documentos);

  return {
    tipoPecaSugerida,
    tipoPecaConfirmada: input.tipoPecaConfirmada,
    prioridadeSugerida,
    prioridadeConfirmada: input.prioridadeConfirmada,
    urgencia,
    resumoInferido: inferirResumoEstrategia({
      caso: input.caso,
      objetivo: input.objetivo,
      urgencia,
      sugestaoTriagem: input.sugestaoTriagem,
    }),
    alertas: inferirAlertas({
      caso: input.caso,
      objetivo: input.objetivo,
      urgencia,
      sugestaoTriagem: input.sugestaoTriagem,
      documentos: input.documentos,
    }),
    proximasProvidencias: inferirProvidencias({
      objetivo: input.objetivo,
      documentos: input.documentos,
      urgencia,
      sugestaoTriagem: input.sugestaoTriagem,
    }),
  };
}

export function calcularPendencias(draft: NovoPedidoWizardDraft): PendenciaNovoPedido[] {
  const pendencias: PendenciaNovoPedido[] = [];

  if (!draft.caso) {
    pendencias.push({
      codigo: "caso_nao_selecionado",
      titulo: "Selecione um caso",
      descricao: "O pedido precisa nascer vinculado a um caso para manter rastreabilidade e contexto jurídico.",
      severidade: "alta",
      etapaRelacionada: "caso_contexto",
    });
  }

  if (!draft.briefing.contextoFatico.trim()) {
    pendencias.push({
      codigo: "contexto_vazio",
      titulo: "Contexto do pedido ainda está vazio",
      descricao: "Descreva o cenário recebido pelo escritório antes de seguir para a estratégia inicial.",
      severidade: "alta",
      etapaRelacionada: "caso_contexto",
    });
  }

  if (!draft.objetivo.categoria || !draft.objetivo.intencaoSelecionada) {
    pendencias.push({
      codigo: "objetivo_nao_confirmado",
      titulo: "Objetivo jurídico ainda não confirmado",
      descricao: "O sistema pode sugerir caminhos, mas o advogado precisa confirmar a direção do pedido.",
      severidade: "alta",
      etapaRelacionada: "objetivo_juridico",
    });
  }

  if (draft.objetivo.intencaoSelecionada === "outro" && !draft.objetivo.intencaoLivre.trim()) {
    pendencias.push({
      codigo: "objetivo_livre_sem_descricao",
      titulo: "Descreva a orientação livre",
      descricao: "Quando o objetivo é personalizado, a instrução do advogado deve ser explícita.",
      severidade: "alta",
      etapaRelacionada: "objetivo_juridico",
    });
  }

  if (!draft.estrategia.tipoPecaConfirmada && !draft.estrategia.tipoPecaSugerida) {
    pendencias.push({
      codigo: "tipo_peca_nao_definido",
      titulo: "Tipo de peça ainda não está claro",
      descricao: "Confirme uma peça final ou avance com uma orientação mais precisa para o dossiê inicial.",
      severidade: "media",
      etapaRelacionada: "estrategia_inicial",
    });
  }

  if (!draft.briefing.observacoesOperacionais.trim() && draft.documentos.length === 0) {
    pendencias.push({
      codigo: "sem_provas_nem_observacoes",
      titulo: "Faltam provas ou observações operacionais",
      descricao: "Sem documentos anexados, vale registrar ao menos lacunas probatórias ou providências de coleta.",
      severidade: "media",
      etapaRelacionada: "documentos_provas",
    });
  }

  if (!draft.confirmacao.confirmadoPeloUsuario) {
    pendencias.push({
      codigo: "confirmacao_humana_pendente",
      titulo: "Confirmação humana pendente",
      descricao: "A abertura final do pedido exige conferência expressa do responsável.",
      severidade: "alta",
      etapaRelacionada: "revisao_criacao",
    });
  }

  return pendencias;
}

function pushRevisao(
  colecao: EvidenciaRevisaoNovoPedido[],
  input: Omit<EvidenciaRevisaoNovoPedido, "id">,
) {
  colecao.push({
    id: `${input.label}-${colecao.length + 1}`,
    ...input,
  });
}

export function montarRevisaoNovoPedido(draft: NovoPedidoWizardDraft): RevisaoNovoPedido {
  const inferido: EvidenciaRevisaoNovoPedido[] = [];
  const confirmado: EvidenciaRevisaoNovoPedido[] = [];
  const faltando: EvidenciaRevisaoNovoPedido[] = [];

  if (draft.briefing.poloInferido !== "indefinido") {
    pushRevisao(inferido, {
      label: "Polo inferido",
      valor: draft.briefing.poloInferido === "ativo" ? "Polo ativo" : "Polo passivo",
      origem: "inferido",
    });
  } else {
    pushRevisao(faltando, {
      label: "Polo processual",
      valor: "Polo ainda não está claro no caso selecionado.",
      origem: "faltando",
    });
  }

  if (draft.estrategia.urgencia.justificativa) {
    pushRevisao(inferido, {
      label: "Urgência sugerida",
      valor: `${draft.estrategia.urgencia.nivel} — ${draft.estrategia.urgencia.justificativa}`,
      origem: "inferido",
    });
  }

  if (draft.estrategia.tipoPecaSugerida) {
    pushRevisao(inferido, {
      label: "Tipo de peça sugerido",
      valor: draft.estrategia.tipoPecaSugerida,
      origem: "inferido",
    });
  }

  pushRevisao(inferido, {
    label: "Trilha jurídica posterior",
    valor: "Leitura documental estruturada → matriz de fatos e provas → análise adversa → diagnóstico estratégico → teses candidatas.",
    origem: "inferido",
  });

  if (draft.estrategia.tipoPecaConfirmada) {
    pushRevisao(confirmado, {
      label: "Tipo de peça confirmado",
      valor: draft.estrategia.tipoPecaConfirmada,
      origem: "confirmado",
    });
  }

  pushRevisao(inferido, {
    label: "Teses candidatas",
    valor: "Ainda não são geradas no intake. Elas serão propostas após a leitura documental e a matriz de fatos e provas.",
    origem: "inferido",
  });

  if (draft.objetivo.intencaoSelecionada) {
    pushRevisao(confirmado, {
      label: "Objetivo jurídico confirmado",
      valor: resumirObjetivo(draft.objetivo.intencaoSelecionada, draft.objetivo.intencaoLivre),
      origem: "confirmado",
    });
  } else {
    pushRevisao(faltando, {
      label: "Objetivo jurídico",
      valor: "Escolha o que o pedido deve produzir antes da abertura final.",
      origem: "faltando",
    });
  }

  if (draft.briefing.contextoFatico.trim()) {
    pushRevisao(confirmado, {
      label: "Contexto informado",
      valor: draft.briefing.contextoFatico.trim(),
      origem: "confirmado",
    });
  } else {
    pushRevisao(faltando, {
      label: "Contexto do pedido",
      valor: "Ainda não há descrição do cenário jurídico/fático.",
      origem: "faltando",
    });
  }

  if (draft.documentos.length > 0) {
    pushRevisao(confirmado, {
      label: "Documentos anexados",
      valor: `${draft.documentos.length} arquivo(s) preparado(s) para o pedido.`,
      origem: "confirmado",
    });
  } else {
    pushRevisao(faltando, {
      label: "Documentos e provas",
      valor: "Nenhum documento foi anexado até aqui.",
      origem: "faltando",
    });
  }

  return { inferido, confirmado, faltando };
}

export function obterEtapaSeguinte(etapa: EtapaNovoPedidoWizard): EtapaNovoPedidoWizard | null {
  const ordem: EtapaNovoPedidoWizard[] = [
    "caso_contexto",
    "objetivo_juridico",
    "documentos_provas",
    "estrategia_inicial",
    "revisao_criacao",
  ];
  const index = ordem.indexOf(etapa);
  return index >= 0 && index < ordem.length - 1 ? ordem[index + 1] : null;
}

export function obterEtapaAnterior(etapa: EtapaNovoPedidoWizard): EtapaNovoPedidoWizard | null {
  const ordem: EtapaNovoPedidoWizard[] = [
    "caso_contexto",
    "objetivo_juridico",
    "documentos_provas",
    "estrategia_inicial",
    "revisao_criacao",
  ];
  const index = ordem.indexOf(etapa);
  return index > 0 ? ordem[index - 1] : null;
}

export function validarEtapaWizard(etapa: EtapaNovoPedidoWizard, draft: NovoPedidoWizardDraft): string[] {
  switch (etapa) {
    case "caso_contexto":
      return [
        !draft.caso ? "Selecione um caso para continuar." : "",
        !draft.briefing.contextoFatico.trim() ? "Descreva o contexto do pedido antes de avançar." : "",
      ].filter(Boolean);
    case "objetivo_juridico":
      return [
        !draft.objetivo.categoria ? "Escolha uma direção jurídica para o pedido." : "",
        !draft.objetivo.intencaoSelecionada ? "Confirme o objetivo jurídico principal." : "",
        draft.objetivo.intencaoSelecionada === "outro" && !draft.objetivo.intencaoLivre.trim()
          ? "Descreva a orientação livre em português claro."
          : "",
      ].filter(Boolean);
    case "estrategia_inicial":
      return [
        !draft.estrategia.tipoPecaConfirmada && !draft.estrategia.tipoPecaSugerida
          ? "Confirme uma peça final ou aceite uma sugestão de peça."
          : "",
      ].filter(Boolean);
    case "documentos_provas":
      return [];
    case "revisao_criacao":
      return draft.confirmacao.confirmadoPeloUsuario ? [] : ["Confirme explicitamente a revisão humana antes da criação final."];
    default:
      return [];
  }
}

export function construirInputTriagemPreview(draft: NovoPedidoWizardDraft) {
  return {
    previewOnly: true,
    casoId: draft.briefing.casoId,
    descricaoProblema: [
      draft.briefing.contextoFatico.trim(),
      draft.briefing.observacoesOperacionais.trim(),
    ].filter(Boolean).join("\n\n"),
    prazoInformadoCliente: draft.caso?.prazoFinal || undefined,
    documentosAnexados: draft.documentos.map((documento) => documento.nome),
    intencaoExplicita: draft.objetivo.intencaoSelecionada || undefined,
    intencaoCustom:
      draft.objetivo.intencaoSelecionada === "outro" ? draft.objetivo.intencaoLivre.trim() : undefined,
  };
}

export function construirPayloadCriacao(draft: NovoPedidoWizardDraft): PayloadCriacaoWizard {
  const tipoPeca = draft.estrategia.tipoPecaConfirmada ?? draft.estrategia.tipoPecaSugerida;
  const prioridade = draft.estrategia.prioridadeConfirmada ?? draft.estrategia.prioridadeSugerida;
  const tituloObjetivo = resumirObjetivo(draft.objetivo.intencaoSelecionada, draft.objetivo.intencaoLivre);

  if (!draft.caso || !tipoPeca || !draft.objetivo.intencaoSelecionada) {
    throw new Error("O briefing ainda não está completo para criar o pedido.");
  }

  return {
    casoId: draft.caso.id,
    titulo: `${tipoPeca} — ${draft.caso.titulo}`,
    tipoPeca,
    prioridade,
    prazoFinal: draft.caso.prazoFinal || new Date().toISOString().split("T")[0],
    intencaoProcessual: draft.objetivo.intencaoSelecionada,
    intencaoCustom:
      draft.objetivo.intencaoSelecionada === "outro" ? draft.objetivo.intencaoLivre.trim() : undefined,
    contextoFatico: draft.briefing.contextoFatico.trim(),
    observacoesOperacionais: [
      draft.briefing.observacoesOperacionais.trim(),
      draft.confirmacao.observacoesFinais.trim() ? `Revisão final: ${draft.confirmacao.observacoesFinais.trim()}` : "",
      `Objetivo confirmado: ${tituloObjetivo}`,
      "Fluxo jurídico posterior previsto: leitura documental estruturada, matriz de fatos e provas, análise adversa, diagnóstico estratégico e teses candidatas para validação humana.",
    ].filter(Boolean).join("\n"),
  };
}

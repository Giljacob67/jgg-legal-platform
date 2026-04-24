import type {
  ContextoJuridicoPedido,
  DossieJuridicoPedido,
  EtapaPipeline,
  PedidoDePeca,
  ReferenciaDocumentalContexto,
  TeseJuridicaPedido,
} from "@/modules/peticoes/domain/types";

type DocumentoBase = { documentoId: string; titulo: string; tipoDocumento: string };

type BuildDossieInput = {
  pedido?: Partial<PedidoDePeca> | null;
  pedidoId: string;
  versaoContexto: number;
  fatosRelevantes: string[];
  cronologia: Array<{ data: string; descricao: string; documentoId?: string }>;
  pontosControvertidos: string[];
  documentosChave: DocumentoBase[];
  referenciasDocumentais: ReferenciaDocumentalContexto[];
  estrategiaSugerida: string;
  teses: TeseJuridicaPedido[];
  validacaoHumanaTesesPendente: boolean;
  fontesSnapshot: Array<{ etapa: EtapaPipeline; versao: number }>;
  criadoEm?: string;
  snapshotsSaida?: Partial<Record<EtapaPipeline, Record<string, unknown>>>;
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toObjectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    : [];
}

function construirResumoExecutivo(input: BuildDossieInput, totalDocumentos: number) {
  const titulo = input.pedido?.titulo || "Pedido de peça";
  const tipoPeca = input.pedido?.tipoPeca || "peça jurídica";
  const fatos = input.fatosRelevantes.length;
  const pontos = input.pontosControvertidos.length;

  return `${titulo} estruturado como ${tipoPeca}, com ${totalDocumentos} documento(s), ${fatos} fato(s) relevante(s) e ${pontos} ponto(s) controvertido(s) mapeado(s).`;
}

export function buildDossieJuridicoPedido(input: BuildDossieInput): DossieJuridicoPedido {
  const snapshotLeitura = input.snapshotsSaida?.leitura_documental ?? {};
  const snapshotAnaliseAdversa = input.snapshotsSaida?.analise_adversa ?? {};
  const snapshotEstrategia = input.snapshotsSaida?.estrategia_juridica ?? {};
  const snapshotRedacao = input.snapshotsSaida?.redacao ?? {};

  const totalDocumentos =
    toNumber(snapshotLeitura.totalDocumentos, 0) ||
    input.documentosChave.length ||
    input.referenciasDocumentais.length;
  const documentosLidos =
    toNumber(snapshotLeitura.documentosLidos, 0) || input.referenciasDocumentais.length;
  const coberturaLeitura =
    typeof snapshotLeitura.coberturaLeitura === "number"
      ? snapshotLeitura.coberturaLeitura
      : totalDocumentos > 0
        ? Number((documentosLidos / totalDocumentos).toFixed(2))
        : 0;

  const lacunasDocumentais = uniqueStrings([
    ...(totalDocumentos === 0 ? ["Nenhum documento foi vinculado ao pedido até o momento."] : []),
    ...(coberturaLeitura < 1
      ? ["A leitura documental ainda não cobre integralmente os documentos reunidos."]
      : []),
    ...(input.referenciasDocumentais.length === 0
      ? ["Ainda não há referências documentais consolidadas no contexto."]
      : []),
  ]);

  const provasBase = input.documentosChave.length > 0
    ? input.documentosChave
    : input.referenciasDocumentais.map((item) => ({
        documentoId: item.documentoId,
        titulo: item.titulo,
        tipoDocumento: item.tipoDocumento,
      }));

  const matrizFatosEProvas = input.fatosRelevantes.map((fato, index) => {
    const provasRelacionadas = provasBase.slice(0, Math.min(Math.max(provasBase.length, 1), 3));
    const grauCobertura =
      provasRelacionadas.length >= 3 ? "forte" : provasRelacionadas.length >= 1 ? "moderada" : "fraca";

    return {
      id: `MFP-${input.pedidoId}-${index + 1}`,
      fato,
      provasRelacionadas,
      grauCobertura,
      controverso: input.pontosControvertidos.some((item) =>
        item.toLowerCase().includes(fato.toLowerCase()) || fato.toLowerCase().includes(item.toLowerCase()),
      ),
    } as DossieJuridicoPedido["matrizFatosEProvas"][number];
  });

  const tesesConfirmadas = input.teses.filter(
    (
      tese,
    ): tese is TeseJuridicaPedido & {
      statusValidacao: "aprovada" | "ajustada";
    } => tese.statusValidacao === "aprovada" || tese.statusValidacao === "ajustada",
  );

  const pedidosPrioritarios = toStringArray(snapshotEstrategia.pedidos_recomendados);
  const pontosAEvitar = toStringArray(snapshotEstrategia.pontos_a_evitar);
  const linhaArgumentativa =
    typeof snapshotEstrategia.linha_argumentativa === "string" &&
    snapshotEstrategia.linha_argumentativa.trim()
      ? snapshotEstrategia.linha_argumentativa.trim()
      : input.estrategiaSugerida;
  const tesesAplicaveisSnapshot = toObjectArray(snapshotEstrategia.teses_aplicaveis);
  const tesesAplicaveisTitulos = tesesAplicaveisSnapshot
    .map((item) => (typeof item.titulo === "string" ? item.titulo.trim() : ""))
    .filter(Boolean);
  const tesesAplicaveisFundamentos = tesesAplicaveisSnapshot
    .map((item) => (typeof item.fundamento_legal === "string" ? item.fundamento_legal.trim() : ""))
    .filter(Boolean);
  const secoesPadrao = [
    "Síntese fática",
    "Fundamentos jurídicos",
    "Enfrentamento da tese adversa",
    "Pedidos",
    "Requerimentos finais",
  ];

  return {
    briefingJuridico: {
      pedidoId: input.pedidoId,
      casoId: input.pedido?.casoId ?? "",
      tituloPedido: input.pedido?.titulo,
      tipoPeca: input.pedido?.tipoPeca,
      statusPedido: input.pedido?.status,
      prioridade: input.pedido?.prioridade,
      totalDocumentos,
      totalReferenciasDocumentais: input.referenciasDocumentais.length,
      resumoExecutivo: construirResumoExecutivo(input, totalDocumentos),
    },
    contextoDoCaso: {
      fatosRelevantes: input.fatosRelevantes,
      cronologia: input.cronologia,
      pontosControvertidos: input.pontosControvertidos,
    },
    leituraDocumentalEstruturada: {
      totalDocumentos,
      documentosLidos,
      coberturaLeitura,
      documentosChave: input.documentosChave,
      referenciasDocumentais: input.referenciasDocumentais,
      lacunasDocumentais,
    },
    matrizFatosEProvas,
    analiseAdversa: {
      pontosFortes: toStringArray(snapshotAnaliseAdversa.pontos_fortes).length
        ? toStringArray(snapshotAnaliseAdversa.pontos_fortes)
        : uniqueStrings([
            ...(input.fatosRelevantes.length > 0 ? ["Há base fática mínima já consolidada no pedido."] : []),
            ...(input.documentosChave.length > 0 ? ["Há documentos potencialmente úteis para sustentar a narrativa."] : []),
          ]),
      vulnerabilidades: toStringArray(snapshotAnaliseAdversa.pontos_vulneraveis).length
        ? toStringArray(snapshotAnaliseAdversa.pontos_vulneraveis)
        : lacunasDocumentais,
      argumentosAdversos: toStringArray(snapshotAnaliseAdversa.argumentos_adversos_previstos),
      riscosProcessuais: toStringArray(snapshotAnaliseAdversa.riscos_processuais),
      nivelRiscoGeral:
        typeof snapshotAnaliseAdversa.nivel_risco_geral === "string"
          ? ((snapshotAnaliseAdversa.nivel_risco_geral as string) || "indefinido") as
              DossieJuridicoPedido["analiseAdversa"]["nivelRiscoGeral"]
          : "indefinido",
      observacoes:
        typeof snapshotAnaliseAdversa.recomendacoes_cautela === "string" &&
        snapshotAnaliseAdversa.recomendacoes_cautela.trim()
          ? snapshotAnaliseAdversa.recomendacoes_cautela
          : "Análise adversa ainda depende de aprofundamento específico do caso.",
      recomendacoesCautela: uniqueStrings([
        ...toStringArray(snapshotAnaliseAdversa.recomendacoes_cautela),
        ...(typeof snapshotAnaliseAdversa.recomendacoes_cautela === "string"
          ? [snapshotAnaliseAdversa.recomendacoes_cautela]
          : []),
      ]),
    },
    diagnosticoEstrategico: {
      resumo: linhaArgumentativa,
      diretrizPrincipal: linhaArgumentativa,
      alavancas: uniqueStrings([
        ...tesesAplicaveisTitulos,
        ...tesesConfirmadas.map((tese) => tese.titulo),
        ...tesesAplicaveisFundamentos,
        ...input.fatosRelevantes.slice(0, 2),
      ]),
      fragilidades: uniqueStrings([
        ...pontosAEvitar,
        ...input.pontosControvertidos.slice(0, 3),
        ...lacunasDocumentais,
      ]),
      pendencias: uniqueStrings([
        ...(input.validacaoHumanaTesesPendente ? ["Estratégia ainda depende de validação humana de teses."] : []),
        ...lacunasDocumentais,
      ]),
      pontosAEvitar,
      pedidosRecomendados: pedidosPrioritarios,
    },
    tesesCandidatas: input.teses,
    estrategiaAprovada: {
      liberadaParaEstruturacao: tesesConfirmadas.length > 0 && !input.validacaoHumanaTesesPendente,
      resumo:
        tesesConfirmadas.length > 0
          ? `Estratégia apoiada em ${tesesConfirmadas.length} tese(s) validada(s) humanamente.`
          : "Estratégia ainda sem tese validada humanamente.",
      tesesConfirmadas: tesesConfirmadas.map((tese) => ({
        id: tese.id,
        titulo: tese.titulo,
        statusValidacao: tese.statusValidacao,
      })),
    },
    estruturaDaPeca: {
      secoesSugeridas: uniqueStrings([
        ...secoesPadrao,
        ...toStringArray(snapshotRedacao.secoes_sugeridas),
      ]),
      pedidosPrioritarios,
      provasPrioritarias: uniqueStrings(
        input.documentosChave.slice(0, 5).map((item) => `${item.documentoId} - ${item.titulo}`),
      ),
      observacoesDeRedacao: uniqueStrings([
        typeof snapshotRedacao.orientacaoRedacao === "string" ? snapshotRedacao.orientacaoRedacao : "",
        input.estrategiaSugerida,
      ]),
    },
    auditoria: {
      versaoContexto: input.versaoContexto,
      validacaoHumanaTesesPendente: input.validacaoHumanaTesesPendente,
      fontesSnapshot: input.fontesSnapshot,
      atualizadoEm: input.criadoEm,
    },
  };
}

export function enriquecerContextoComDossie(
  contexto: ContextoJuridicoPedido,
  pedido?: Partial<PedidoDePeca> | null,
  snapshotsSaida?: Partial<Record<EtapaPipeline, Record<string, unknown>>>,
): ContextoJuridicoPedido {
  return {
    ...contexto,
    dossieJuridico: buildDossieJuridicoPedido({
      pedido,
      pedidoId: contexto.pedidoId,
      versaoContexto: contexto.versaoContexto,
      fatosRelevantes: contexto.fatosRelevantes,
      cronologia: contexto.cronologia,
      pontosControvertidos: contexto.pontosControvertidos,
      documentosChave: contexto.documentosChave,
      referenciasDocumentais: contexto.referenciasDocumentais,
      estrategiaSugerida: contexto.estrategiaSugerida,
      teses: contexto.teses,
      validacaoHumanaTesesPendente: contexto.validacaoHumanaTesesPendente,
      fontesSnapshot: contexto.fontesSnapshot,
      criadoEm: contexto.criadoEm,
      snapshotsSaida,
    }),
  };
}

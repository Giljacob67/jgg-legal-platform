import "server-only";

import { getInteligenciaJuridicaInfra } from "@/modules/peticoes/inteligencia-juridica/infrastructure/provider.server";
import type {
  AlertaJuridico,
  AvaliacaoTese,
  ChecklistAvaliado,
  ChecklistItem,
  ChecklistItemAvaliado,
  EntradaMotorInteligenciaJuridica,
  PainelInteligenciaJuridica,
  PesosScoreQualidade,
  ResumoExecutivoInteligencia,
  ScoreQualidadeMinuta,
  TeseJuridicaCatalogo,
} from "@/modules/peticoes/inteligencia-juridica/domain/types";
import type { BlocoMinutaId } from "@/modules/peticoes/domain/geracao-minuta";

const BLOCOS_ORDENADOS: Array<{ id: BlocoMinutaId; marcador: string }> = [
  { id: "cabecalho", marcador: "I. Cabeçalho" },
  { id: "qualificacao_identificacao", marcador: "II. Qualificação e identificação" },
  { id: "sintese_fatica", marcador: "III. Síntese fática" },
  { id: "fundamentos", marcador: "IV. Fundamentos" },
  { id: "pedidos", marcador: "V. Pedidos" },
  { id: "fechamento", marcador: "VI. Fechamento" },
];

const TOKENS_ESSENCIAIS_POR_PECA: Record<string, string[]> = {
  peticao_inicial: ["fatos", "fundamentos", "pedidos"],
  contestacao: ["preliminar", "mérito", "improced"],
  manifestacao: ["manifest", "requer"],
  embargos_execucao: ["execu", "inexig", "excesso"],
  apelacao_civel: ["apela", "reforma", "senten"],
  recurso_especial_civel: ["violação", "dispositivo federal", "prequestion"],
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizarTexto(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function dividirTokens(texto: string): string[] {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
}

function termosSignificativos(texto: string, limite = 8): string[] {
  const stopwords = new Set([
    "para",
    "com",
    "sobre",
    "pelos",
    "pelas",
    "entre",
    "deste",
    "desta",
    "dessa",
    "esse",
    "essa",
    "como",
    "tese",
    "juridica",
    "juridico",
    "processo",
    "pedido",
  ]);

  const frequencia = new Map<string, number>();
  for (const token of dividirTokens(texto)) {
    if (stopwords.has(token)) {
      continue;
    }

    frequencia.set(token, (frequencia.get(token) ?? 0) + 1);
  }

  return [...frequencia.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([token]) => token);
}

function contemToken(texto: string, token: string): boolean {
  return normalizarTexto(texto).includes(normalizarTexto(token));
}

function extrairSecoesMinuta(conteudo: string): Record<BlocoMinutaId, string> {
  const secoes = {} as Record<BlocoMinutaId, string>;

  const posicoes = BLOCOS_ORDENADOS.map((bloco) => ({
    ...bloco,
    index: conteudo.indexOf(bloco.marcador),
  })).filter((item) => item.index >= 0);

  for (let i = 0; i < posicoes.length; i += 1) {
    const atual = posicoes[i];
    const proximo = posicoes[i + 1];
    const inicio = atual.index + atual.marcador.length;
    const fim = proximo ? proximo.index : conteudo.length;
    secoes[atual.id] = conteudo.slice(inicio, fim).trim();
  }

  for (const bloco of BLOCOS_ORDENADOS) {
    if (!secoes[bloco.id]) {
      secoes[bloco.id] = "";
    }
  }

  return secoes;
}

function scoreTeses(input: {
  teses: TeseJuridicaCatalogo[];
  conteudoMinuta: string;
  contextoTexto: string;
  estrategia: string;
  pontosControvertidos: string[];
  referencias: string[];
}): AvaliacaoTese[] {
  const corpus = `${input.conteudoMinuta}\n${input.contextoTexto}`;

  return input.teses
    .map((tese) => {
      const palavrasEncontradas = tese.palavrasChave.filter((palavra) => contemToken(corpus, palavra));
      const scorePalavras = tese.palavrasChave.length
        ? Math.round((palavrasEncontradas.length / tese.palavrasChave.length) * 40)
        : 0;

      const gatilhosAcionados = tese.gatilhos.filter((gatilho) => {
        if (gatilho.tipo === "palavra_chave" || gatilho.tipo === "padrao_textual") {
          return contemToken(corpus, gatilho.valor);
        }

        if (gatilho.tipo === "ponto_controvertido") {
          return input.pontosControvertidos.some((ponto) => contemToken(ponto, gatilho.valor));
        }

        if (gatilho.tipo === "estrategia") {
          return contemToken(input.estrategia, gatilho.valor);
        }

        return input.referencias.some((referencia) => contemToken(referencia, gatilho.valor));
      });

      const pesoTotal = tese.gatilhos.reduce((acc, gatilho) => acc + gatilho.peso, 0);
      const pesoAcionado = gatilhosAcionados.reduce((acc, gatilho) => acc + gatilho.peso, 0);
      const scoreGatilhos = pesoTotal > 0 ? Math.round((pesoAcionado / pesoTotal) * 45) : 0;

      const pontosBonus = input.pontosControvertidos.filter((ponto) => contemToken(corpus, ponto)).length;
      const bonusPontos = input.pontosControvertidos.length
        ? Math.round((pontosBonus / input.pontosControvertidos.length) * 7)
        : 0;

      const tokensEstrategia = termosSignificativos(input.estrategia, 6);
      const estrategiaCorrespondencias = tokensEstrategia.filter((token) => contemToken(input.conteudoMinuta, token)).length;
      const bonusEstrategia = tokensEstrategia.length
        ? Math.round((estrategiaCorrespondencias / tokensEstrategia.length) * 8)
        : 0;

      const scoreContexto = clamp(bonusPontos + bonusEstrategia, 0, 15);
      const scoreAderencia = clamp(scorePalavras + scoreGatilhos + scoreContexto);

      const lacunasPalavras = tese.palavrasChave
        .filter((palavra) => !contemToken(corpus, palavra))
        .slice(0, 4)
        .map((palavra) => `Palavra-chave ausente: ${palavra}`);

      const lacunasGatilhos = tese.gatilhos
        .filter((gatilho) => !gatilhosAcionados.some((acionado) => acionado.id === gatilho.id))
        .slice(0, 3)
        .map((gatilho) => `Gatilho não acionado: ${gatilho.valor}`);

      return {
        teseId: tese.id,
        titulo: tese.titulo,
        scoreAderencia,
        justificativa: `${palavrasEncontradas.length} palavra(s)-chave e ${gatilhosAcionados.length} gatilho(s) acionados.`,
        lacunas: [...lacunasPalavras, ...lacunasGatilhos],
        gatilhosAcionados: gatilhosAcionados.map((gatilho) => ({
          gatilhoId: gatilho.id,
          tipo: gatilho.tipo,
          valor: gatilho.valor,
          peso: gatilho.peso,
        })),
      } satisfies AvaliacaoTese;
    })
    .filter((avaliacao) => avaliacao.scoreAderencia >= 45)
    .sort((a, b) => b.scoreAderencia - a.scoreAderencia)
    .slice(0, 5);
}

function avaliarChecklist(input: {
  itens: ChecklistItem[];
  conteudoMinuta: string;
  secoes: Record<BlocoMinutaId, string>;
}): ChecklistAvaliado {
  const avaliados: ChecklistItemAvaliado[] = input.itens.map((item) => {
    const textoBloco = item.blocoEsperado === "geral" ? input.conteudoMinuta : input.secoes[item.blocoEsperado] ?? "";

    const tokenEncontrado = item.tokensEsperados.find(
      (token) => contemToken(textoBloco, token) || contemToken(input.conteudoMinuta, token),
    );

    return {
      itemId: item.id,
      descricao: item.descricao,
      categoria: item.categoria,
      status: tokenEncontrado ? "atendido" : "pendente",
      evidencia: tokenEncontrado ? `Token encontrado: ${tokenEncontrado}` : undefined,
    };
  });

  const obrigatorios = avaliados.filter((item) => item.categoria === "obrigatorio");
  const recomendaveis = avaliados.filter((item) => item.categoria === "recomendavel");

  const obrigatoriosAtendidos = obrigatorios.filter((item) => item.status === "atendido").length;
  const recomendaveisAtendidos = recomendaveis.filter((item) => item.status === "atendido").length;

  const coberturaObrigatoria = obrigatorios.length > 0 ? obrigatoriosAtendidos / obrigatorios.length : 1;
  const coberturaRecomendavel = recomendaveis.length > 0 ? recomendaveisAtendidos / recomendaveis.length : 1;

  return {
    obrigatorios,
    recomendaveis,
    coberturaObrigatoria,
    coberturaRecomendavel,
  };
}

function calcularCoerencia(input: {
  conteudoMinuta: string;
  contextoEstrategia: string;
  pontosControvertidos: string[];
  fatosRelevantes: string[];
  secoes: Record<BlocoMinutaId, string>;
  referenciasDocumentais: string[];
}): number {
  const fundamentosPedidos = `${input.secoes.fundamentos}\n${input.secoes.pedidos}`;
  const coerenciaPontos = input.pontosControvertidos.length
    ? Math.round(
        (input.pontosControvertidos.filter((ponto) => contemToken(fundamentosPedidos, ponto)).length /
          input.pontosControvertidos.length) *
          35,
      )
    : 0;

  const tokensEstrategia = termosSignificativos(input.contextoEstrategia, 8);
  const coerenciaEstrategia = tokensEstrategia.length
    ? Math.round(
        (tokensEstrategia.filter((token) => contemToken(input.secoes.fundamentos, token)).length /
          tokensEstrategia.length) *
          35,
      )
    : 0;

  const pedidosTexto = input.secoes.pedidos;
  const coerenciaFatosPedidos = input.fatosRelevantes.length
    ? Math.round(
        (input.fatosRelevantes.filter((fato) => {
          const tokensFato = termosSignificativos(fato, 4);
          const temTokenFato = tokensFato.some((token) => contemToken(pedidosTexto, token));
          const temReferencia = input.referenciasDocumentais.some((referencia) => contemToken(pedidosTexto, referencia));
          return temTokenFato || temReferencia;
        }).length /
          input.fatosRelevantes.length) *
          30,
      )
    : 0;

  return clamp(coerenciaPontos + coerenciaEstrategia + coerenciaFatosPedidos);
}

function gerarAlertas(input: {
  conteudoMinuta: string;
  tipoPecaCanonica: string;
  contextoDisponivel: boolean;
  pontosControvertidos: string[];
  estrategia: string;
  fatosRelevantes: string[];
  referenciasDocumentais: string[];
}): AlertaJuridico[] {
  const alertas: AlertaJuridico[] = [];

  if (input.referenciasDocumentais.length === 0 && !/doc[-\s]?\d+/i.test(input.conteudoMinuta)) {
    alertas.push({
      codigo: "AJ-001",
      tipo: "ausencia_documentos",
      severidade: "alta",
      mensagem: "Não há referências documentais vinculadas à minuta.",
      recomendacao: "Vincular documentos-chave e citar ao menos uma referência nos pedidos ou fundamentos.",
    });
  }

  if (input.fatosRelevantes.length > 0) {
    const fatosNaoUtilizados = input.fatosRelevantes.filter((fato) => !contemToken(input.conteudoMinuta, fato));
    if (fatosNaoUtilizados.length > 0) {
      alertas.push({
        codigo: "AJ-002",
        tipo: "fatos_nao_utilizados",
        severidade: fatosNaoUtilizados.length > 2 ? "alta" : "media",
        mensagem: `${fatosNaoUtilizados.length} fato(s) relevante(s) ainda não aparecem de forma clara na minuta.`,
        recomendacao: "Reforçar narrativa fática e vincular fatos aos pedidos principais.",
      });
    }
  }

  const tokensEssenciais = TOKENS_ESSENCIAIS_POR_PECA[input.tipoPecaCanonica] ?? [];
  const encontrouEssencial = tokensEssenciais.some((token) => contemToken(input.conteudoMinuta, token));
  if (tokensEssenciais.length > 0 && !encontrouEssencial) {
    alertas.push({
      codigo: "AJ-003",
      tipo: "inconsistencia_tipo_peca",
      severidade: "alta",
      mensagem: "A estrutura textual está pouco aderente ao tipo de peça selecionado.",
      recomendacao: "Revisar blocos obrigatórios e vocabulário típico da peça antes da finalização.",
    });
  }

  const contextoIncompleto =
    !input.contextoDisponivel ||
    !input.estrategia.trim() ||
    input.pontosControvertidos.length === 0 ||
    input.fatosRelevantes.length === 0;

  if (contextoIncompleto) {
    alertas.push({
      codigo: "AJ-004",
      tipo: "contexto_incompleto",
      severidade: "media",
      mensagem: "O contexto jurídico consolidado ainda está incompleto para validação plena da minuta.",
      recomendacao: "Concluir extração de fatos, estratégia e pontos controvertidos antes da versão final.",
    });
  }

  return alertas;
}

function calcularScoreQualidade(input: {
  checklist: ChecklistAvaliado;
  secoes: Record<BlocoMinutaId, string>;
  referenciasDocumentais: string[];
  conteudoMinuta: string;
  coerencia: number;
  pesos: PesosScoreQualidade;
}): ScoreQualidadeMinuta {
  const scoreChecklistObrigatorio = Math.round(input.checklist.coberturaObrigatoria * 100);
  const scoreChecklistRecomendavel = Math.round(input.checklist.coberturaRecomendavel * 100);

  const blocosPreenchidos = BLOCOS_ORDENADOS.filter((bloco) => (input.secoes[bloco.id] ?? "").trim().length >= 24).length;
  const scoreBlocos = Math.round((blocosPreenchidos / BLOCOS_ORDENADOS.length) * 100);

  const referenciasCitadas = input.referenciasDocumentais.filter((referencia) => contemToken(input.conteudoMinuta, referencia));
  const scoreReferencias = input.referenciasDocumentais.length
    ? Math.round((referenciasCitadas.length / input.referenciasDocumentais.length) * 100)
    : 0;

  const somaPesos =
    input.pesos.checklistObrigatorio +
    input.pesos.checklistRecomendavel +
    input.pesos.blocos +
    input.pesos.referencias +
    input.pesos.coerencia;

  const total = somaPesos > 0
    ? Math.round(
        (scoreChecklistObrigatorio * input.pesos.checklistObrigatorio +
          scoreChecklistRecomendavel * input.pesos.checklistRecomendavel +
          scoreBlocos * input.pesos.blocos +
          scoreReferencias * input.pesos.referencias +
          input.coerencia * input.pesos.coerencia) /
          somaPesos,
      )
    : 0;

  const nivel = total >= 85 ? "excelente" : total >= 65 ? "bom" : total >= 40 ? "regular" : "critico";

  return {
    total: clamp(total),
    nivel,
    breakdown: {
      checklistObrigatorio: scoreChecklistObrigatorio,
      checklistRecomendavel: scoreChecklistRecomendavel,
      blocos: scoreBlocos,
      referencias: scoreReferencias,
      coerencia: input.coerencia,
    },
  };
}

function montarResumoExecutivo(input: {
  score: ScoreQualidadeMinuta;
  tesesSugeridas: AvaliacaoTese[];
  checklist: ChecklistAvaliado;
  alertas: AlertaJuridico[];
}): ResumoExecutivoInteligencia {
  const pendenciasObrigatorias = input.checklist.obrigatorios.filter((item) => item.status === "pendente").length;
  const alertaAlta = input.alertas.some((alerta) => alerta.severidade === "alta");

  const prioridadeRevisao: ResumoExecutivoInteligencia["prioridadeRevisao"] = alertaAlta
    ? "alta"
    : input.score.total < 65 || pendenciasObrigatorias > 0
      ? "media"
      : "baixa";

  const principaisPontos: string[] = [
    `Score de qualidade atual: ${input.score.total}/100 (${input.score.nivel}).`,
    pendenciasObrigatorias > 0
      ? `${pendenciasObrigatorias} item(ns) obrigatório(s) do checklist ainda pendente(s).`
      : "Checklist obrigatório sem pendências críticas.",
    input.tesesSugeridas[0]
      ? `Tese líder: ${input.tesesSugeridas[0].titulo} (${input.tesesSugeridas[0].scoreAderencia}/100).`
      : "Sem tese com aderência mínima nesta versão da minuta.",
  ];

  if (input.alertas.length > 0) {
    principaisPontos.push(`Alertas ativos: ${input.alertas.map((alerta) => alerta.codigo).join(", ")}.`);
  }

  return {
    statusGeral:
      input.score.nivel === "excelente"
        ? "Minuta consistente para revisão final."
        : input.score.nivel === "bom"
          ? "Minuta boa, com ajustes pontuais recomendados."
          : input.score.nivel === "regular"
            ? "Minuta exige reforço jurídico antes de aprovação."
            : "Minuta em nível crítico, revisar estrutura e consistência jurídica.",
    principaisPontos,
    prioridadeRevisao,
  };
}

export async function avaliarPainelInteligenciaJuridica(
  input: EntradaMotorInteligenciaJuridica,
): Promise<PainelInteligenciaJuridica> {
  const contexto = input.contextoJuridico;
  const fatosRelevantes = contexto?.fatosRelevantes ?? [];
  const pontosControvertidos = contexto?.pontosControvertidos ?? [];
  const estrategia = contexto?.estrategiaSugerida ?? "";

  const referenciasDocumentais = [
    ...(contexto?.documentosChave ?? []).map((item) => `${item.documentoId} ${item.titulo}`),
    ...(contexto?.referenciasDocumentais ?? []).map((item) => `${item.documentoId} ${item.titulo}`),
  ];

  const contextoTexto = [
    fatosRelevantes.join("\n"),
    pontosControvertidos.join("\n"),
    estrategia,
    referenciasDocumentais.join("\n"),
  ]
    .filter((item) => item.trim().length > 0)
    .join("\n\n");

  const infra = getInteligenciaJuridicaInfra();
  const [teses, itensChecklist, pesos] = await Promise.all([
    infra.catalogoTesesRepository.listarPorTipoEMateria({
      tipoPecaCanonica: input.tipoPecaCanonica,
      materiaCanonica: input.materiaCanonica,
      contextoTexto: input.minuta.conteudoAtual + "\n" + contextoTexto,
    }),
    infra.checklistRepository.listarPorTipoPeca({ tipoPecaCanonica: input.tipoPecaCanonica }),
    infra.configScoreRepository.obterPesos(),
  ]);

  const secoes = extrairSecoesMinuta(input.minuta.conteudoAtual);

  const tesesSugeridas = scoreTeses({
    teses,
    conteudoMinuta: input.minuta.conteudoAtual,
    contextoTexto,
    estrategia,
    pontosControvertidos,
    referencias: referenciasDocumentais,
  });

  const checklist = avaliarChecklist({
    itens: itensChecklist,
    conteudoMinuta: input.minuta.conteudoAtual,
    secoes,
  });

  const alertas = gerarAlertas({
    conteudoMinuta: input.minuta.conteudoAtual,
    tipoPecaCanonica: input.tipoPecaCanonica,
    contextoDisponivel: !!contexto,
    pontosControvertidos,
    estrategia,
    fatosRelevantes,
    referenciasDocumentais,
  });

  const coerencia = calcularCoerencia({
    conteudoMinuta: input.minuta.conteudoAtual,
    contextoEstrategia: estrategia,
    pontosControvertidos,
    fatosRelevantes,
    secoes,
    referenciasDocumentais,
  });

  const score = calcularScoreQualidade({
    checklist,
    secoes,
    referenciasDocumentais,
    conteudoMinuta: input.minuta.conteudoAtual,
    coerencia,
    pesos,
  });

  const resumoExecutivo = montarResumoExecutivo({
    score,
    tesesSugeridas,
    checklist,
    alertas,
  });

  return {
    resumoExecutivo,
    tesesSugeridas,
    checklist,
    alertas,
    score,
  };
}

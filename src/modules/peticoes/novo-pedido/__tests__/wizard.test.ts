import { describe, expect, it } from "vitest";
import type { Caso } from "@/modules/casos/domain/types";
import {
  calcularPendencias,
  consolidarEstrategiaInicial,
  consolidarTesesPreliminares,
  construirPayloadCriacao,
  criarDraftInicial,
  montarRevisaoNovoPedido,
  normalizarTipoPecaCatalogo,
  validarEtapaWizard,
} from "@/modules/peticoes/novo-pedido/application/wizard";

function formatDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function criarCaso(overrides: Partial<Caso> = {}): Caso {
  return {
    id: "CAS-2026-100",
    titulo: "Cobrança contratual com pedido liminar",
    cliente: "Agro Atlas Ltda",
    materia: "Cível",
    tribunal: "TJGO",
    status: "em análise",
    prazoFinal: formatDateOffset(10),
    resumo: "Cliente busca cobrança com tutela de urgência.",
    partes: [
      { nome: "Agro Atlas Ltda", papel: "autor" },
      { nome: "Banco Exemplo S.A.", papel: "réu" },
    ],
    documentosRelacionados: [],
    eventos: [],
    ...overrides,
  };
}

describe("wizard novo pedido", () => {
  it("deve iniciar draft com caso e prioridade sugerida coerente", () => {
    const caso = criarCaso();
    const draft = criarDraftInicial([caso]);

    expect(draft.caso?.id).toBe(caso.id);
    expect(draft.briefing.poloInferido).toBe("ativo");
    expect(draft.estrategia.prioridadeSugerida).toBe("média");
    expect(draft.confirmacao.confirmadoPeloUsuario).toBe(false);
  });

  it("deve validar bloqueios nas etapas iniciais", () => {
    const draft = criarDraftInicial([]);

    const errosContexto = validarEtapaWizard("caso_contexto", draft);
    const errosObjetivo = validarEtapaWizard("objetivo_juridico", draft);

    expect(errosContexto).toContain("Selecione um caso para continuar.");
    expect(errosObjetivo).toContain("Escolha uma direção jurídica para o pedido.");
  });

  it("deve gerar estratégia inicial a partir da triagem", () => {
    const caso = criarCaso();
    const estrategia = consolidarEstrategiaInicial({
      caso,
      objetivo: {
        categoria: "responder_parte_contraria",
        intencaoSelecionada: "redigir_contestacao",
        intencaoLivre: "",
      },
      prazoFinal: caso.prazoFinal,
      documentos: [],
      sugestaoTriagem: {
        modo: "ai",
        poloDetectado: "passivo",
        justificativaPolo: "Cliente figura como réu.",
        tipoPecaClassificado: "Contestação",
        intencaoDetectada: "redigir_contestacao",
        prioridade: "alta",
        prazoSugerido: caso.prazoFinal,
        responsavelSugerido: "Dra. Ana Beatriz Santos",
        resumoJustificativa: "Prazo curto para defesa e risco processual alto.",
        alertas: ["Verificar prazo de contestação."],
        pontosVulneraveisAdverso: [],
        etapaInicial: "classificacao",
      },
      tipoPecaConfirmada: null,
      prioridadeConfirmada: null,
    });

    expect(estrategia.tipoPecaSugerida).toBe("Contestação");
    expect(estrategia.prioridadeSugerida).toBe("alta");
    expect(estrategia.alertas).toContain("Verificar prazo de contestação.");
    expect(estrategia.proximasProvidencias.some((item) => item.includes("Responsável sugerido"))).toBe(true);
  });

  it("deve montar revisão separando inferido, confirmado e faltando", () => {
    const caso = criarCaso();
    const draft = criarDraftInicial([caso]);

    draft.briefing.contextoFatico = "Inadimplência contratual com risco de dissipação patrimonial.";
    draft.objetivo.categoria = "responder_parte_contraria";
    draft.objetivo.intencaoSelecionada = "redigir_contestacao";
    draft.estrategia.tipoPecaSugerida = "Contestação";
    draft.estrategia.tipoPecaConfirmada = "Contestação";
    draft.teses = [
      {
        id: "TESE-1",
        titulo: "Tese principal",
        descricao: "Neutralizar narrativa da parte autora.",
        fundamentos: ["Contrato contém cláusula favorável."],
        origem: "inferida",
        statusValidacao: "aprovada",
        observacoesHumanas: "",
      },
    ];
    draft.confirmacao.confirmadoPeloUsuario = true;

    const revisao = montarRevisaoNovoPedido(draft);

    expect(revisao.inferido.some((item) => item.label === "Polo inferido")).toBe(true);
    expect(revisao.confirmado.some((item) => item.label === "Objetivo jurídico confirmado")).toBe(true);
    expect(revisao.faltando.some((item) => item.label === "Documentos e provas")).toBe(true);
  });

  it("deve construir payload final e bloquear draft incompleto", () => {
    const caso = criarCaso();
    const draft = criarDraftInicial([caso]);

    draft.briefing.contextoFatico = "Resumo fático consolidado.";
    draft.objetivo.categoria = "peticao_personalizada";
    draft.objetivo.intencaoSelecionada = "outro";
    draft.objetivo.intencaoLivre = "Redigir petição para homologação parcial de acordo.";
    draft.estrategia.tipoPecaConfirmada = "Petição inicial";
    draft.teses = [
      {
        id: "TESE-2",
        titulo: "Tese manual",
        descricao: "Homologação parcial com preservação de cláusulas pendentes.",
        fundamentos: ["Manifestação expressa das partes."],
        origem: "manual",
        statusValidacao: "ajustada",
        observacoesHumanas: "Revisar multa contratual.",
      },
    ];
    draft.confirmacao.confirmadoPeloUsuario = true;
    draft.confirmacao.observacoesFinais = "Validar prova documental antes do protocolo.";

    const payload = construirPayloadCriacao(draft);
    expect(payload.casoId).toBe(caso.id);
    expect(payload.intencaoCustom).toContain("homologação parcial");
    expect(payload.observacoesOperacionais).toContain("Revisão final:");
    expect(payload.observacoesOperacionais).toContain("Objetivo confirmado:");
    expect(payload.observacoesOperacionais).toContain("Teses validadas no intake:");

    const incompleto = criarDraftInicial([]);
    expect(() => construirPayloadCriacao(incompleto)).toThrow(
      "O briefing ainda não está completo para criar o pedido.",
    );
  });

  it("deve sinalizar pendências críticas quando revisão humana estiver pendente", () => {
    const draft = criarDraftInicial([criarCaso()]);
    draft.briefing.contextoFatico = "Contexto descrito.";
    draft.objetivo.categoria = "iniciar_medida";
    draft.objetivo.intencaoSelecionada = "redigir_peticao_inicial";

    const pendencias = calcularPendencias(draft);
    expect(pendencias.some((item) => item.codigo === "confirmacao_humana_pendente")).toBe(true);
    expect(pendencias.some((item) => item.codigo === "tese_nao_validada")).toBe(true);
  });

  it("deve gerar teses preliminares e exigir validação humana", () => {
    const caso = criarCaso();
    const draft = criarDraftInicial([caso]);
    draft.briefing.contextoFatico = "Cliente relata inadimplemento e risco de perecimento do direito.";
    draft.objetivo.categoria = "iniciar_medida";
    draft.objetivo.intencaoSelecionada = "redigir_peticao_inicial";

    const estrategia = consolidarEstrategiaInicial({
      caso,
      objetivo: draft.objetivo,
      prazoFinal: caso.prazoFinal,
      documentos: [],
      sugestaoTriagem: null,
      tipoPecaConfirmada: "Petição inicial",
      prioridadeConfirmada: null,
    });

    const teses = consolidarTesesPreliminares({
      draft,
      estrategia,
    });

    expect(teses.length).toBeGreaterThan(0);

    const erros = validarEtapaWizard("estrategia_inicial", {
      ...draft,
      estrategia,
      teses,
    });
    expect(erros).toContain("Valide ao menos uma tese sugerida ou adicione uma tese manual antes de avançar.");
  });

  it("deve normalizar tipo de peça inválido vindo da triagem", () => {
    expect(normalizarTipoPecaCatalogo("Peça inventada")).toBeNull();
    expect(normalizarTipoPecaCatalogo("Petição inicial")).toBe("Petição inicial");
  });
});

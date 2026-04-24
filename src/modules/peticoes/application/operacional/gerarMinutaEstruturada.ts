import "server-only";

import type { Caso } from "@/modules/casos/domain/types";
import type {
  BlocoMinutaGerada,
  GerarMinutaEstruturadaInput,
  MateriaCanonica,
  MinutaGeradaEstruturada,
  TipoPecaCanonica,
} from "@/modules/peticoes/domain/geracao-minuta";
import { normalizarMateriaCanonica, normalizarTipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import { obterTemplateJuridicoAtivoParaGeracao } from "@/modules/peticoes/base-juridica-viva/application/useCases";

const TITULO_TIPO_PECA: Record<TipoPecaCanonica, string> = {
  peticao_inicial: "PETIÇÃO INICIAL",
  contestacao: "CONTESTAÇÃO",
  replica: "RÉPLICA",
  embargos_execucao: "EMBARGOS À EXECUÇÃO",
  impugnacao: "IMPUGNAÇÃO AO CUMPRIMENTO DE SENTENÇA",
  manifestacao: "MANIFESTAÇÃO",
  apelacao_civel: "APELAÇÃO CÍVEL",
  recurso_especial_civel: "RECURSO ESPECIAL CÍVEL",
  agravo_instrumento: "AGRAVO DE INSTRUMENTO",
  agravo_interno: "AGRAVO INTERNO",
  embargos_declaracao: "EMBARGOS DE DECLARAÇÃO",
  mandado_seguranca: "MANDADO DE SEGURANÇA",
  habeas_corpus: "HABEAS CORPUS",
  reconvencao: "RECONVENÇÃO",
  excecao_pre_executividade: "EXCEÇÃO DE PRÉ-EXECUTIVIDADE",
  tutela_urgencia: "PEDIDO DE TUTELA DE URGÊNCIA",
  contrarrazoes: "CONTRARRAZÕES",
};

const NOME_MATERIA: Record<MateriaCanonica, string> = {
  civel: "Cível",
  trabalhista: "Trabalhista",
  tributario: "Tributário",
  criminal: "Criminal",
  consumidor: "Consumidor",
  empresarial: "Empresarial",
  familia: "Família",
  ambiental: "Ambiental",
  agrario_agronegocio: "Agrário / Agronegócio",
  bancario: "Bancário",
};

function montarLinhaPartes(caso?: Caso): string {
  if (!caso?.partes?.length) {
    return "Partes em qualificação complementar no pedido.";
  }

  return caso.partes.map((parte) => `${parte.nome} (${parte.papel})`).join("; ");
}

function montarListaNumerada(itens: string[], fallback: string): string {
  if (itens.length === 0) {
    return `1. ${fallback}`;
  }

  return itens.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function montarReferenciasDocumentais(
  referencias: Array<{ documentoId: string; titulo: string; tipoDocumento: string }>,
): string[] {
  return referencias
    .slice(0, 8)
    .map((item) => `${item.documentoId} - ${item.titulo} (${item.tipoDocumento})`);
}

function normalizeSectionLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolverSecaoEstruturada(value: string): string | null {
  const normalized = normalizeSectionLabel(value);

  if (normalized.includes("cabecalho")) return "cabecalho";
  if (normalized.includes("qualificacao") || normalized.includes("identificacao")) return "qualificacao_identificacao";
  if (normalized.includes("sintese") || normalized.includes("fatica") || normalized.includes("fatos")) return "sintese_fatica";
  if (normalized.includes("fundamento")) return "fundamentos";
  if (normalized.includes("enfrentamento") || normalized.includes("tese adversa") || normalized.includes("adversa")) {
    return "enfrentamento_tese_adversa";
  }
  if (normalized.includes("pedido")) return "pedidos";
  if (normalized.includes("fechamento") || normalized.includes("requerimento")) return "fechamento";

  return null;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

export async function gerarMinutaEstruturada(input: {
  pedido: GerarMinutaEstruturadaInput["pedido"];
  caso?: Caso;
  contextoJuridico: GerarMinutaEstruturadaInput["contextoJuridico"];
}): Promise<MinutaGeradaEstruturada> {
  const tipoPecaCanonica = normalizarTipoPecaCanonica(input.pedido.tipoPeca);
  const materiaCanonica = normalizarMateriaCanonica(input.caso?.materia);
  const template = await obterTemplateJuridicoAtivoParaGeracao({
    tipoPecaCanonica,
    materiaCanonica,
  });

  const contexto = input.contextoJuridico;
  const dossie = contexto?.dossieJuridico;
  const estrategia =
    contexto?.estrategiaSugerida?.trim() ||
    "Consolidar narrativa cronológica e fortalecer a subsunção jurídica com base nas provas disponíveis.";

  const fatos = montarListaNumerada(
    (contexto?.fatosRelevantes ?? []).slice(0, 6),
    "Fatos essenciais ainda em consolidação na etapa de extração.",
  );

  const cronologia = montarListaNumerada(
    (contexto?.cronologia ?? []).slice(0, 5).map((evento) => `${evento.data}: ${evento.descricao}`),
    "Cronologia detalhada em atualização pelo pipeline operacional.",
  );

  const pontosControvertidos = montarListaNumerada(
    (contexto?.pontosControvertidos ?? []).slice(0, 4),
    "Sem controvérsia adicional registrada até o momento.",
  );

  const referenciasConsolidadas = montarReferenciasDocumentais(contexto?.documentosChave ?? []);
  const referenciasDocumentais =
    referenciasConsolidadas.length > 0
      ? referenciasConsolidadas
      : montarReferenciasDocumentais(contexto?.referenciasDocumentais ?? []);
  const estruturaDaPeca = dossie?.estruturaDaPeca;
  const tesesConfirmadas = dossie?.estrategiaAprovada.tesesConfirmadas.map((item) => item.titulo) ?? [];
  const argumentosAdversos = dossie?.analiseAdversa.argumentosAdversos ?? [];
  const riscosProcessuais = dossie?.analiseAdversa.riscosProcessuais ?? [];
  const pontosAEvitar = dossie?.diagnosticoEstrategico.pontosAEvitar ?? [];
  const pedidosEstruturados = dedupe([
    ...(estruturaDaPeca?.pedidosPrioritarios ?? []),
    ...(dossie?.diagnosticoEstrategico.pedidosRecomendados ?? []),
    ...template.clausulasBase.pedidos,
  ]);
  const observacoesDeRedacao = dedupe([
    ...(estruturaDaPeca?.observacoesDeRedacao ?? []),
    dossie?.diagnosticoEstrategico.diretrizPrincipal ?? "",
    estrategia,
  ]);
  const provasPrioritarias = dedupe([
    ...(estruturaDaPeca?.provasPrioritarias ?? []),
    ...referenciasDocumentais,
  ]);

  const especializacao = template.especializacaoPorMateria[materiaCanonica];
  const blocosBase = new Map<string, Omit<BlocoMinutaGerada, "titulo">>([
    [
      "cabecalho",
      {
        id: "cabecalho",
        conteudo: [
          `AO JUÍZO DO ${input.caso?.tribunal ?? "JUÍZO COMPETENTE"}`,
          "",
          `${TITULO_TIPO_PECA[tipoPecaCanonica]} - ${NOME_MATERIA[materiaCanonica]}`,
          `Pedido: ${input.pedido.id}`,
          `Caso: ${input.pedido.casoId}`,
        ].join("\n"),
      },
    ],
    [
      "qualificacao_identificacao",
      {
        id: "qualificacao_identificacao",
        conteudo: [
          `Peça vinculada ao caso ${input.pedido.casoId} (${input.caso?.titulo ?? "título em atualização"}).`,
          `Cliente: ${input.caso?.cliente ?? "cliente não identificado"}.`,
          `Partes: ${montarLinhaPartes(input.caso)}.`,
        ].join("\n"),
      },
    ],
    [
      "sintese_fatica",
      {
        id: "sintese_fatica",
        conteudo: [
          "Fatos relevantes consolidados:",
          fatos,
          "",
          "Cronologia essencial:",
          cronologia,
        ].join("\n"),
      },
    ],
    [
      "fundamentos",
      {
        id: "fundamentos",
        conteudo: [
          "Diretrizes do template jurídico:",
          montarListaNumerada(template.clausulasBase.fundamentos, "Fundamentação complementar a definir."),
          "",
          `Especialização (${NOME_MATERIA[materiaCanonica]}): ${especializacao.diretrizFundamentos}`,
          `Termos prioritários: ${especializacao.termosPreferenciais.join(", ")}.`,
          `Linha argumentativa central: ${dossie?.diagnosticoEstrategico.diretrizPrincipal ?? estrategia}`,
          "",
          "Teses confirmadas para sustentar a redação:",
          montarListaNumerada(
            tesesConfirmadas,
            "Teses confirmadas ainda em consolidação pelo responsável jurídico.",
          ),
          "",
          "Pontos controvertidos mapeados:",
          pontosControvertidos,
        ].join("\n"),
      },
    ],
    [
      "enfrentamento_tese_adversa",
      {
        id: "enfrentamento_tese_adversa",
        conteudo: [
          "Argumentos adversos previstos:",
          montarListaNumerada(
            argumentosAdversos,
            "Contraposição adversa ainda sem detalhamento específico nesta versão.",
          ),
          "",
          "Riscos processuais a neutralizar:",
          montarListaNumerada(
            riscosProcessuais,
            "Riscos processuais relevantes ainda em consolidação.",
          ),
          "",
          "Pontos a evitar na redação:",
          montarListaNumerada(
            pontosAEvitar,
            "Evitar contradições internas e alegações sem suporte probatório suficiente.",
          ),
        ].join("\n"),
      },
    ],
    [
      "pedidos",
      {
        id: "pedidos",
        conteudo: [
          montarListaNumerada(pedidosEstruturados, "Pedidos a consolidar na revisão técnica."),
          "",
          `Ajuste por matéria: ${especializacao.diretrizPedidos}`,
          "",
          "Provas/documentos prioritários para sustentar os pedidos:",
          montarListaNumerada(
            provasPrioritarias,
            "Referências documentais serão anexadas após atualização da base de documentos.",
          ),
        ].join("\n"),
      },
    ],
    [
      "fechamento",
      {
        id: "fechamento",
        conteudo: [
          "Observações de redação para a versão base:",
          montarListaNumerada(
            observacoesDeRedacao,
            "Fechar a peça preservando coerência entre fatos, fundamentos e pedidos.",
          ),
          "",
          "Nesses termos, requer-se o regular processamento da presente peça e o acolhimento dos pedidos formulados.",
          "",
          "Termos em que,",
          "Pede deferimento.",
          "",
          `Gerado no HUB JGG Group em ${new Date().toLocaleDateString("pt-BR")}.`,
        ].join("\n"),
      },
    ],
  ]);

  const ordemEstruturada = dedupe([
    ...(estruturaDaPeca?.secoesSugeridas ?? [])
      .map((item) => resolverSecaoEstruturada(item))
      .filter((item): item is string => Boolean(item)),
    "cabecalho",
    "qualificacao_identificacao",
    "sintese_fatica",
    "fundamentos",
    "pedidos",
    "fechamento",
  ]);

  if (argumentosAdversos.length > 0 || riscosProcessuais.length > 0 || pontosAEvitar.length > 0) {
    const indexFundamentos = ordemEstruturada.indexOf("fundamentos");
    const hasBlock = ordemEstruturada.includes("enfrentamento_tese_adversa");
    if (!hasBlock) {
      if (indexFundamentos >= 0) {
        ordemEstruturada.splice(indexFundamentos + 1, 0, "enfrentamento_tese_adversa");
      } else {
        ordemEstruturada.push("enfrentamento_tese_adversa");
      }
    }
  }

  const TITULO_POR_ID: Record<string, string> = {
    cabecalho: "I. Cabeçalho",
    qualificacao_identificacao: "II. Qualificação e identificação",
    sintese_fatica: "III. Síntese fática",
    fundamentos: "IV. Fundamentos",
    enfrentamento_tese_adversa: "V. Enfrentamento da tese adversa",
    pedidos: "VI. Pedidos",
    fechamento: "VII. Fechamento",
  };

  const blocos: BlocoMinutaGerada[] = ordemEstruturada
    .map((id) => {
      const bloco = blocosBase.get(id);
      if (!bloco) return null;
      return {
        ...bloco,
        titulo: TITULO_POR_ID[id] ?? bloco.id,
      };
    })
    .filter((item): item is BlocoMinutaGerada => Boolean(item));

  return {
    conteudoCompleto: blocos.map((bloco) => `${bloco.titulo}\n\n${bloco.conteudo}`).join("\n\n"),
    blocos,
    rastro: {
      templateId: template.id,
      templateNome: template.nome,
      templateVersao: template.versao,
      tipoPecaCanonica,
      materiaCanonica,
      contextoVersao: contexto?.versaoContexto,
      referenciasDocumentais: referenciasDocumentais.map((item) => item.split(" - ")[0]),
    },
  };
}

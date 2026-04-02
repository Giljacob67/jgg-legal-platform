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
import { obterTemplateJuridicoAtivoPorTipoPeca } from "@/modules/peticoes/infrastructure/templates/catalogoTemplatesJuridicos";

const TITULO_TIPO_PECA: Record<TipoPecaCanonica, string> = {
  peticao_inicial: "PETIÇÃO INICIAL",
  contestacao: "CONTESTAÇÃO",
  manifestacao: "MANIFESTAÇÃO",
  embargos_execucao: "EMBARGOS À EXECUÇÃO",
  apelacao_civel: "APELAÇÃO CÍVEL",
  recurso_especial_civel: "RECURSO ESPECIAL CÍVEL",
};

const NOME_MATERIA: Record<MateriaCanonica, string> = {
  civel: "Cível",
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

export function gerarMinutaEstruturada(input: {
  pedido: GerarMinutaEstruturadaInput["pedido"];
  caso?: Caso;
  contextoJuridico: GerarMinutaEstruturadaInput["contextoJuridico"];
}): MinutaGeradaEstruturada {
  const tipoPecaCanonica = normalizarTipoPecaCanonica(input.pedido.tipoPeca);
  const materiaCanonica = normalizarMateriaCanonica(input.caso?.materia);
  const template = obterTemplateJuridicoAtivoPorTipoPeca(tipoPecaCanonica);

  const contexto = input.contextoJuridico;
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

  const especializacao = template.especializacaoPorMateria[materiaCanonica];

  const blocos: BlocoMinutaGerada[] = [
    {
      id: "cabecalho",
      titulo: "I. Cabeçalho",
      conteudo: [
        `AO JUÍZO DO ${input.caso?.tribunal ?? "JUÍZO COMPETENTE"}`,
        "",
        `${TITULO_TIPO_PECA[tipoPecaCanonica]} - ${NOME_MATERIA[materiaCanonica]}`,
        `Pedido: ${input.pedido.id}`,
        `Caso: ${input.pedido.casoId}`,
      ].join("\n"),
    },
    {
      id: "qualificacao_identificacao",
      titulo: "II. Qualificação e identificação",
      conteudo: [
        `Peça vinculada ao caso ${input.pedido.casoId} (${input.caso?.titulo ?? "título em atualização"}).`,
        `Cliente: ${input.caso?.cliente ?? "cliente não identificado"}.`,
        `Partes: ${montarLinhaPartes(input.caso)}.`,
      ].join("\n"),
    },
    {
      id: "sintese_fatica",
      titulo: "III. Síntese fática",
      conteudo: [
        "Fatos relevantes consolidados:",
        fatos,
        "",
        "Cronologia essencial:",
        cronologia,
      ].join("\n"),
    },
    {
      id: "fundamentos",
      titulo: "IV. Fundamentos",
      conteudo: [
        "Diretrizes do template jurídico:",
        montarListaNumerada(template.clausulasBase.fundamentos, "Fundamentação complementar a definir."),
        "",
        `Especialização (${NOME_MATERIA[materiaCanonica]}): ${especializacao.diretrizFundamentos}`,
        `Termos prioritários: ${especializacao.termosPreferenciais.join(", ")}.`,
        `Estratégia jurídica sugerida: ${estrategia}`,
        "",
        "Pontos controvertidos mapeados:",
        pontosControvertidos,
      ].join("\n"),
    },
    {
      id: "pedidos",
      titulo: "V. Pedidos",
      conteudo: [
        montarListaNumerada(template.clausulasBase.pedidos, "Pedidos a consolidar na revisão técnica."),
        "",
        `Ajuste por matéria: ${especializacao.diretrizPedidos}`,
        "",
        "Referências documentais consideradas:",
        montarListaNumerada(
          referenciasDocumentais,
          "Referências documentais serão anexadas após atualização da base de documentos.",
        ),
      ].join("\n"),
    },
    {
      id: "fechamento",
      titulo: "VI. Fechamento",
      conteudo: [
        "Nesses termos, requer-se o regular processamento da presente peça e o acolhimento dos pedidos formulados.",
        "",
        "Termos em que,",
        "Pede deferimento.",
        "",
        `Gerado no HUB JGG Group em ${new Date().toLocaleDateString("pt-BR")}.`,
      ].join("\n"),
    },
  ];

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

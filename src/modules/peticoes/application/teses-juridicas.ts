import type {
  ContextoJuridicoPedido,
  TeseJuridicaPedido,
} from "@/modules/peticoes/domain/types";

type BuildTesesInput = {
  pedidoId: string;
  estrategiaSugerida: string;
  pontosControvertidos: string[];
  fatosRelevantes: string[];
  documentosRelacionados: string[];
  contextoAnterior: ContextoJuridicoPedido | null;
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function criarIdTese(pedidoId: string, chave: string): string {
  return `TSE-${pedidoId}-${slugify(chave) || "base"}`;
}

function limitarStrings(values: string[], max: number): string[] {
  return values
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function criarTesesInferidas(input: Omit<BuildTesesInput, "contextoAnterior">): TeseJuridicaPedido[] {
  const teses: TeseJuridicaPedido[] = [];
  const fatosBase = limitarStrings(input.fatosRelevantes, 2);
  const fundamentosBase = [
    ...fatosBase.map((fato) => `Fato crítico mapeado: ${fato}`),
    ...limitarStrings(input.pontosControvertidos, 2).map((ponto) => `Ponto controvertido a enfrentar: ${ponto}`),
  ];

  if (input.estrategiaSugerida.trim()) {
    teses.push({
      id: criarIdTese(input.pedidoId, `principal-${input.estrategiaSugerida}`),
      titulo: "Tese principal sugerida",
      descricao: input.estrategiaSugerida.trim(),
      fundamentos: fundamentosBase.length > 0
        ? fundamentosBase
        : ["Consolidar adequação entre fatos extraídos, fundamento jurídico e pedido principal."],
      documentosRelacionados: input.documentosRelacionados.slice(0, 3),
      origem: "ia",
      statusValidacao: "pendente",
    });
  }

  limitarStrings(input.pontosControvertidos, 2).forEach((ponto, index) => {
    teses.push({
      id: criarIdTese(input.pedidoId, `controversia-${index + 1}-${ponto}`),
      titulo: `Enfrentar controvérsia ${index + 1}`,
      descricao: `Sustentar tese específica para neutralizar o ponto controvertido: ${ponto}.`,
      fundamentos: [
        `Controvérsia identificada no caso: ${ponto}.`,
        ...fatosBase.map((fato) => `Suporte fático relacionado: ${fato}`),
      ],
      documentosRelacionados: input.documentosRelacionados.slice(0, 2),
      origem: "ia",
      statusValidacao: "pendente",
    });
  });

  return teses;
}

export function buildMapaTesesContexto(input: BuildTesesInput): TeseJuridicaPedido[] {
  const inferidas = criarTesesInferidas(input);
  const anteriores = new Map((input.contextoAnterior?.teses ?? []).map((tese) => [tese.id, tese]));

  const inferidasMescladas = inferidas.map((tese) => {
    const anterior = anteriores.get(tese.id);
    if (!anterior) {
      return tese;
    }

    return {
      ...tese,
      titulo: anterior.titulo || tese.titulo,
      descricao: anterior.descricao || tese.descricao,
      fundamentos: anterior.fundamentos.length > 0 ? anterior.fundamentos : tese.fundamentos,
      documentosRelacionados:
        anterior.documentosRelacionados.length > 0 ? anterior.documentosRelacionados : tese.documentosRelacionados,
      statusValidacao: anterior.statusValidacao,
      observacoesHumanas: anterior.observacoesHumanas,
      confirmadaPor: anterior.confirmadaPor,
      confirmadaEm: anterior.confirmadaEm,
    };
  });

  const manuais = (input.contextoAnterior?.teses ?? []).filter(
    (tese) => tese.origem === "usuario" && !inferidasMescladas.some((item) => item.id === tese.id),
  );

  return [...inferidasMescladas, ...manuais];
}

export function teseFoiValidadaHumanamente(tese: TeseJuridicaPedido): boolean {
  return tese.statusValidacao === "aprovada" || tese.statusValidacao === "ajustada";
}

export function existeValidacaoHumanaPendente(teses: TeseJuridicaPedido[]): boolean {
  const tesesInferidas = teses.filter((tese) => tese.origem === "ia");
  const existeTeseValidada = teses.some(teseFoiValidadaHumanamente);

  if (!existeTeseValidada) {
    return true;
  }

  return tesesInferidas.some((tese) => tese.statusValidacao === "pendente");
}

export function resumirMapaTeses(teses: TeseJuridicaPedido[]) {
  const inferidasPendentes = teses.filter(
    (tese) => tese.origem === "ia" && tese.statusValidacao === "pendente",
  ).length;
  const validadas = teses.filter(teseFoiValidadaHumanamente).length;
  const rejeitadas = teses.filter((tese) => tese.statusValidacao === "rejeitada").length;

  return {
    inferidasPendentes,
    validadas,
    rejeitadas,
  };
}

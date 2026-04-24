/**
 * Domain types para matriz de fatos e provas expandida.
 * Extende MatrizFatoProvaItem existente com classificação jurídica,
 * força probatória, risco, recomendação e observação.
 */

export type ClassificacaoFato =
  | "comprovado"
  | "alegado_pelo_cliente"
  | "extraido_documento_adverso"
  | "controvertido"
  | "lacuna_probatoria";

export type ForcaProbativa = "alta" | "media" | "baixa";

export type RiscoFato = "baixo" | "medio" | "alto";

export type RecomendacaoUsoPeca =
  | "usar"
  | "usar_com_cautela"
  | "nao_usar_ainda"
  | "pedir_complemento";

export interface ItemMatrizFatoProva {
  id: string;
  fato: string;
  classificacao: ClassificacaoFato;
  fonte: string;
  documentoRelacionado?: {
    documentoId: string;
    titulo: string;
    tipoDocumento: string;
  };
  forcaProbativa: ForcaProbativa;
  riscoAssociado: RiscoFato;
  recomendacaoUso: RecomendacaoUsoPeca;
  observacaoJuridica?: string;
}

export interface SinteseFatosProvas {
  totalFatos: number;
  fatosComprovados: number;
  fatosControvertidos: number;
  lacunasProbatarias: number;
  nivelSegurancaFactual: "alto" | "medio" | "baixo" | "indefinido";
  justificativaNivel: string;
}

export function calcularSinteseFatosProvas(
  itens: ItemMatrizFatoProva[] | undefined | null,
): SinteseFatosProvas {
  const fatos = itens ?? [];
  const comprovados = fatos.filter((f) => f.classificacao === "comprovado").length;
  const controvertidos = fatos.filter((f) => f.classificacao === "controvertido").length;
  const lacunas = fatos.filter((f) => f.classificacao === "lacuna_probatoria").length;

  let nivel: SinteseFatosProvas["nivelSegurancaFactual"] = "indefinido";
  let justificativa = "Matriz ainda vazia.";

  if (fatos.length === 0) {
    nivel = "indefinido";
    justificativa = "Nenhum fato mapeado. Execute o pipeline ou adicione fatos manualmente.";
  } else if (lacunas === 0 && comprovados / fatos.length >= 0.6) {
    nivel = "alto";
    justificativa = `Mais de 60% dos fatos estão comprovados e não há lacunas probatórias.`;
  } else if (lacunas > 0 && comprovados / fatos.length >= 0.4) {
    nivel = "medio";
    justificativa = `Base factual presente, mas existem ${lacunas} lacuna(s) probatória(s) a endereçar.`;
  } else if (lacunas > fatos.length / 2) {
    nivel = "baixo";
    justificativa = `Mais da metade dos fatos são lacunas probatórias. A peça não deve avançar sem complementação.`;
  } else {
    nivel = "medio";
    justificativa = `Base factual parcial. Avaliar lacunas e controvérsias antes de estruturar teses.`;
  }

  return {
    totalFatos: fatos.length,
    fatosComprovados: comprovados,
    fatosControvertidos: controvertidos,
    lacunasProbatarias: lacunas,
    nivelSegurancaFactual: nivel,
    justificativaNivel: justificativa,
  };
}

export function normalizarMatrizFatoProva(
  matrizExistente: import("./types").MatrizFatoProvaItem[] | undefined | null,
  documentosChave: Array<{ documentoId: string; titulo: string; tipoDocumento: string }>,
): ItemMatrizFatoProva[] {
  if (!matrizExistente || matrizExistente.length === 0) {
    return [];
  }

  return matrizExistente.map((item) => {
    const doc = documentosChave.find((d) =>
      item.provasRelacionadas.some((p) => p.documentoId === d.documentoId),
    );

    const classificacao: ClassificacaoFato = item.controverso
      ? "controvertido"
      : item.grauCobertura === "forte"
        ? "comprovado"
        : item.grauCobertura === "moderada"
          ? "alegado_pelo_cliente"
          : "lacuna_probatoria";

    return {
      id: item.id,
      fato: item.fato,
      classificacao,
      fonte: doc?.titulo ?? "Fonte não identificada",
      documentoRelacionado: doc
        ? { documentoId: doc.documentoId, titulo: doc.titulo, tipoDocumento: doc.tipoDocumento }
        : undefined,
      forcaProbativa: item.grauCobertura === "forte" ? "alta" : item.grauCobertura === "moderada" ? "media" : "baixa",
      riscoAssociado:
        item.controverso
          ? "alto"
          : item.grauCobertura === "fraca"
            ? "medio"
            : "baixo",
      recomendacaoUso:
        item.grauCobertura === "forte"
          ? "usar"
          : item.grauCobertura === "moderada"
            ? "usar_com_cautela"
            : item.controverso
              ? "pedir_complemento"
              : "nao_usar_ainda",
    };
  });
}

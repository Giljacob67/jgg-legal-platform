import { SYSTEM_PROMPT_BASE } from "./base";
import { criarTesesJuridicasPadrao, criarTemplatesJuridicosPadrao } from "@/modules/peticoes/base-juridica-viva/infrastructure/defaultCatalog";
import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import type { ChunkRelevante } from "@/modules/biblioteca-juridica/infrastructure/vectorStore";

export function buildEstrategiaPrompt(
  fatos: unknown,
  analiseAdversa: unknown,
  materia: MateriaCanonica,
  tipoPeca: TipoPecaCanonica,
  chunksRelevantes: ChunkRelevante[] = [],
  polo?: "ativo" | "passivo" | "indefinido",
): { system: string; prompt: string } {
  const tesesDoRamo = criarTesesJuridicasPadrao().filter(
    (t) => t.materias.includes(materia) && t.tiposPecaCanonica.includes(tipoPeca),
  );

  const template = criarTemplatesJuridicosPadrao().find(
    (t) => t.tiposPecaCanonica.includes(tipoPeca) && t.materias.includes(materia),
  );
  const especializacao = template?.especializacaoPorMateria[materia];

  const poloContexto =
    polo === "ativo"
      ? "POLO PROCESSUAL: ATIVO (nosso cliente é o AUTOR / EXEQUENTE / REQUERENTE — estratégia de ataque, prova do fato constitutivo)"
      : polo === "passivo"
        ? "POLO PROCESSUAL: PASSIVO (nosso cliente é o RÉU / EXECUTADO / REQUERIDO — estratégia de defesa, impugnação, desconstituição do crédito)"
        : "POLO PROCESSUAL: INDEFINIDO (adaptar estratégia conforme identificação no contexto)";

  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Elabore a estratégia jurídica para o caso, considerando os fatos e a análise adversarial.

MATÉRIA: ${materia}
TIPO DE PEÇA: ${tipoPeca}
${poloContexto}

FATOS DO CASO:
${JSON.stringify(fatos, null, 2)}

ANÁLISE ADVERSARIAL:
${JSON.stringify(analiseAdversa, null, 2)}

TESES JURÍDICAS APLICÁVEIS DO NOSSO BANCO DE CONHECIMENTO:
${
  tesesDoRamo.length > 0
    ? tesesDoRamo.map((t) => `- ${t.titulo}: ${t.fundamentoSintetico}`).join("\n")
    : "Nenhuma tese específica catalogada — desenvolver com base na legislação."
}

DIRETRIZES PARA MATÉRIA ${materia.toUpperCase()}:
${especializacao?.diretrizFundamentos ?? "Seguir princípios gerais do direito processual civil."}
${
  chunksRelevantes.length > 0
    ? `\nCONHECIMENTO RELEVANTE DA BIBLIOTECA (fragmentos semanticamente próximos ao caso):\n${chunksRelevantes.map((c, i) => `[${i + 1}] ${c.conteudo}`).join("\n\n")}\n`
    : ""
}
INSTRUÇÕES:
1. Indique as TESES PRINCIPAIS a adotar (com fundamento legal explícito)
2. Defina a LINHA ARGUMENTATIVA central
3. Priorize argumentos de maior solidez jurisprudencial
4. Indique o que NÃO alegar (riscos de contradição ou enfraquecimento)

FORMATO:
{
  "teses_aplicaveis": [
    { "titulo": "...", "fundamento_legal": "Art. X da Lei Y", "prioridade": "principal|secundaria" }
  ],
  "linha_argumentativa": "...",
  "pontos_a_evitar": ["...", "..."],
  "pedidos_recomendados": ["...", "..."]
}`,
  };
}

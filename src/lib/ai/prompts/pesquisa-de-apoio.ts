import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import type { MateriaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

interface Chunk {
  id: string;
  conteudo: string;
  metadados?: Record<string, unknown>;
}

export function buildPesquisaApoioPrompt(
  contexto: ContextoJuridicoPedido | null,
  materia: MateriaCanonica,
  chunks: string[],
): { system: string; prompt: string } {
  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Realize uma pesquisa de apoio na biblioteca de conhecimento jurídico para um caso na área de ${materia.toUpperCase()}.

CONTEXTO DO CASO:
${JSON.stringify(contexto ?? {}, null, 2)}

CHUNKS RECUPERADOS DA BIBLIOTECA:
${chunks.length > 0 ? chunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n") : "(Nenhum chunk encontrado — biblioteca vazia ou consulta sem resultados)"}

INSTRUÇÕES:
1. Identifique quais chunks são mais relevantes para o caso
2. Extraia fundamentação legal e jurisprudencial dos chunks
3. Identifique lacunas de conhecimento (áreas onde a biblioteca não tem informação suficiente)
4. Avalie a qualidade geral da informação disponível
5. Sugira expansão da biblioteca se necessário

FORMATO:
{
  "chunks_utilizados": ["ID ou trecho dos chunks utilizados como apoio"],
  "fundamentacao_referencias": ["Referência legal ou jurisprudencial extraída dos chunks"],
  "lacunas_conhecimento": ["Área onde a biblioteca não possui informação suficiente"],
  "calidad_informacional": "alta|media|baixa",
  "recomendacao_expansao": "Sugestão de expansão da biblioteca com novos documentos (opcional)"
}`,
  };
}